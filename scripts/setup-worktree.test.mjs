import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { copyApprovedEnv } from "./setup-worktree.mjs";

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
