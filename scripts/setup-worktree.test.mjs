import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { execFileSync, spawnSync } from "node:child_process";
import { copyApprovedEnv } from "./setup-worktree.mjs";

test("the saved T3 command sets up a worktree when checkout paths contain spaces", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "starter T3 setup test "));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = path.join(root, "primary checkout");
  const target = path.join(root, "new worktree");
  const unrelated = path.join(root, "other repository");
  await mkdir(path.join(source, "scripts"), { recursive: true });
  await writeFile(path.join(source, "package.json"), JSON.stringify({
    private: true,
    scripts: { "setup:worktree": "node scripts/setup-worktree.mjs" },
  }));
  await writeFile(path.join(source, ".gitignore"), "node_modules/\n.env*\n");
  await writeFile(path.join(source, "scripts/setup-worktree.mjs"),
    await readFile(new URL("./setup-worktree.mjs", import.meta.url)));
  const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  git(source, "init");
  git(source, "add", ".");
  git(source, "-c", "user.name=Setup test", "-c", "user.email=setup@example.invalid", "-c", "commit.gpgsign=false", "commit", "-m", "fixture");
  git(source, "worktree", "add", "--detach", target);
  await mkdir(unrelated);
  git(unrelated, "init");
  await writeFile(path.join(unrelated, "package.json"), '{"private":true}');

  for (const workspace of ["frontend", "studio"]) {
    await mkdir(path.join(source, workspace));
    await writeFile(path.join(source, workspace, ".env.local"), `source ${workspace}`);
    await writeFile(path.join(source, workspace, ".env.production"), "do not copy");
  }
  await writeFile(path.join(source, ".env.local"), "do not copy root env");

  // Let pnpm run the real setup script, but stop its install from using the network.
  const bin = path.join(target, "node_modules/.bin");
  const installLog = path.join(target, "install.json");
  await mkdir(bin, { recursive: true });
  await writeFile(path.join(bin, "pnpm"), `#!/bin/sh
if [ "$1" != install ] || [ "$2" != --frozen-lockfile ] || [ "$#" != 2 ]; then
  exit 99
fi
printf '%s' '["install","--frozen-lockfile"]' > install.json
`, { mode: 0o755 });
  const run = (command) => spawnSync(command, { cwd: target, shell: true, encoding: "utf8" });

  const noSource = run("pnpm setup:worktree");
  assert.notEqual(noSource.status, 0);
  assert.match(noSource.stderr, /Pass --source <checkout>/);
  const otherSource = spawnSync("pnpm", ["setup:worktree", "--source", unrelated], { cwd: target, encoding: "utf8" });
  assert.notEqual(otherSource.status, 0);
  assert.match(otherSource.stderr, /not worktrees of the same repository/);
  await assert.rejects(readFile(installLog), { code: "ENOENT" });

  const config = JSON.parse(await readFile(new URL("../t3.json", import.meta.url), "utf8"));
  const setup = config.scripts.find((script) => script.runOnWorktreeCreate);
  assert.ok(setup, "T3 must run setup when it creates a worktree");
  const result = run(setup.command);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.deepEqual(JSON.parse(await readFile(installLog, "utf8")), ["install", "--frozen-lockfile"]);
  for (const workspace of ["frontend", "studio"]) {
    assert.equal(await readFile(path.join(target, workspace, ".env.local"), "utf8"), `source ${workspace}`);
    await assert.rejects(readFile(path.join(target, workspace, ".env.production")), { code: "ENOENT" });
    await writeFile(path.join(target, workspace, ".env.local"), `keep ${workspace}`);
  }
  await assert.rejects(readFile(path.join(target, ".env.local")), { code: "ENOENT" });
  const repeated = run(setup.command);
  assert.equal(repeated.status, 0, `${repeated.stdout}\n${repeated.stderr}`);
  for (const workspace of ["frontend", "studio"]) {
    assert.equal(await readFile(path.join(target, workspace, ".env.local"), "utf8"), `keep ${workspace}`);
  }
});

test("copy preserves existing files and only copies approved env files", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "starter-env-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const dir of ["source/frontend", "source/studio", "target/frontend", "target/studio"]) await mkdir(path.join(root, dir), { recursive: true });
  await writeFile(path.join(root, "source/frontend/.env.local"), "source frontend");
  await writeFile(path.join(root, "source/studio/.env.local"), "source studio");
  await writeFile(path.join(root, "target/frontend/.env.local"), "keep");
  await copyApprovedEnv({ sourceRoot: path.join(root, "source"), destinationRoot: path.join(root, "target") });
  assert.equal(await readFile(path.join(root, "target/frontend/.env.local"), "utf8"), "keep");
  assert.equal(await readFile(path.join(root, "target/studio/.env.local"), "utf8"), "source studio");
});

test("source symlinks are rejected before any copying", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "starter-env-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const dir of ["source/frontend", "source/studio", "target"]) await mkdir(path.join(root, dir), { recursive: true });
  await writeFile(path.join(root, "source/frontend/.env.local"), "test");
  await symlink(path.join(root, "source/frontend/.env.local"), path.join(root, "source/studio/.env.local"));
  await assert.rejects(copyApprovedEnv({ sourceRoot: path.join(root, "source"), destinationRoot: path.join(root, "target") }), /regular file/);
  await assert.rejects(readFile(path.join(root, "target/frontend/.env.local")), { code: "ENOENT" });
});
