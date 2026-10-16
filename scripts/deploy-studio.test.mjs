import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

function deploy(t, { production, local, inherited, args = [], exitCode = 0 } = {}) {
  const root = mkdtempSync(path.join(tmpdir(), "starter-deploy-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const directory of ["scripts", "studio", "bin"]) mkdirSync(path.join(root, directory));
  copyFileSync(new URL("./deploy-studio.mjs", import.meta.url), path.join(root, "scripts/deploy-studio.mjs"));
  writeFileSync(path.join(root, "studio/.env.local"), local ?? "SANITY_AUTH_TOKEN=test-token\nSANITY_STUDIO_PREVIEW_URL=http://localhost:3006\nSANITY_STUDIO_APP_ID=local-app\n");
  writeFileSync(path.join(root, "studio/.env.production"), production ?? "SANITY_STUDIO_PREVIEW_URL=https://example.com\nSANITY_STUDIO_APP_ID=production-app\n");
  const pnpm = path.join(root, "bin/pnpm");
  writeFileSync(pnpm, `#!${process.execPath}
console.log(JSON.stringify({
  args: process.argv.slice(2),
  cwd: process.cwd(),
  preview: process.env.SANITY_STUDIO_PREVIEW_URL,
  appId: process.env.SANITY_STUDIO_APP_ID,
  token: process.env.SANITY_AUTH_TOKEN,
  mode: process.env.SANITY_ACTIVE_ENV,
  nodeEnv: process.env.NODE_ENV,
}));
process.exit(${exitCode});
`);
  chmodSync(pnpm, 0o755);
  return {
    root,
    ...spawnSync(process.execPath, [path.join(root, "scripts/deploy-studio.mjs"), ...args], {
      cwd: tmpdir(),
      env: { ...process.env, ...inherited, PATH: `${path.dirname(pnpm)}${path.delimiter}${process.env.PATH}` },
      encoding: "utf8",
    }),
  };
}

test("deployment uses production settings even when the terminal has local overrides", (t) => {
  const result = deploy(t, {
    inherited: {
      SANITY_STUDIO_PREVIEW_URL: "http://localhost:3000",
      SANITY_STUDIO_APP_ID: "wrong-app",
      SANITY_AUTH_TOKEN: "wrong-token",
      SANITY_ACTIVE_ENV: "development",
      NODE_ENV: "development",
    },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout.trim().split("\n").at(-1)), {
    args: ["exec", "sanity", "deploy"],
    cwd: path.join(result.root, "studio"),
    preview: "https://example.com",
    appId: "production-app",
    token: "test-token",
    mode: "production",
    nodeEnv: "production",
  });
});

test("invalid production addresses stop before the deployment command runs", async (t) => {
  for (const preview of [
    "http://localhost:3000",
    "https://localhost",
    "https://localhost.",
    "https://preview.localhost",
    "https://127.0.0.1",
    "https://192.168.1.10",
    "https://8.8.8.8",
    "https://2130706433",
    "http://example.com",
    "https://[::1]",
    "https://camp.local",
    "https://camp",
    "https://example.com/page",
    "https://example.com?drafts=1",
    "https://example.com/#page",
    "https://user:password@example.com",
    "not-a-url",
  ]) {
    await t.test(preview, (t) => {
      const result = deploy(t, { production: `SANITY_STUDIO_PREVIEW_URL="${preview}"\nSANITY_STUDIO_APP_ID=production-app\n` });
      assert.equal(result.status, 1);
      assert.equal(result.stdout, "");
      assert.doesNotMatch(result.stderr, /password/);
    });
  }
});

test("missing production settings cannot fall back to local or inherited settings", (t) => {
  const result = deploy(t, { production: "", inherited: { SANITY_STUDIO_PREVIEW_URL: "https://example.com", SANITY_STUDIO_APP_ID: "inherited-app" } });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /studio\/\.env\.production/);
});

test("deployment requires the token from the local file", (t) => {
  const result = deploy(t, { local: "", inherited: { SANITY_AUTH_TOKEN: "inherited-token" } });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /SANITY_AUTH_TOKEN/);
});

test("deployment cannot skip the build with extra CLI arguments", (t) => {
  const result = deploy(t, { args: ["--no-build"] });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
});

test("the first deployment runs without an app ID only when asked for", (t) => {
  const production = "SANITY_STUDIO_PREVIEW_URL=https://example.com\n";
  const first = deploy(t, {
    production,
    args: ["--first"],
    inherited: { SANITY_STUDIO_APP_ID: "inherited-app" },
  });
  assert.equal(first.status, 0, first.stderr);
  const lines = first.stdout.trim().split("\n");
  const run = JSON.parse(lines.find((line) => line.startsWith("{")));
  assert.equal(run.appId, undefined);
  assert.equal(run.preview, "https://example.com");
  assert.match(first.stdout, /SANITY_STUDIO_APP_ID in studio\/\.env\.production/);

  const missing = deploy(t, { production });
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /--first/);

  const repeated = deploy(t, { args: ["--first"] });
  assert.equal(repeated.status, 1);
  assert.equal(repeated.stdout, "");
  assert.match(repeated.stderr, /without --first/);
});

test("a failed Sanity deployment returns its failure status", (t) => {
  assert.equal(deploy(t, { exitCode: 7 }).status, 7);
});


test("each production setting is required", async (t) => {
  for (const production of [
    "SANITY_STUDIO_APP_ID=production-app\n",
    "SANITY_STUDIO_PREVIEW_URL=https://example.com\n",
    'SANITY_STUDIO_PREVIEW_URL=" "\nSANITY_STUDIO_APP_ID=production-app\n',
    'SANITY_STUDIO_PREVIEW_URL=https://example.com\nSANITY_STUDIO_APP_ID=" "\n',
  ]) {
    await t.test(production.trim(), (t) => {
      const result = deploy(t, { production });
      assert.equal(result.status, 1);
      assert.equal(result.stdout, "");
      assert.match(result.stderr, /studio\/\.env\.production/);
    });
  }
});

test("a production token cannot replace a missing local token", (t) => {
  const result = deploy(t, {
    local: 'SANITY_AUTH_TOKEN=" "\n',
    production: "SANITY_STUDIO_PREVIEW_URL=https://example.com\nSANITY_STUDIO_APP_ID=production-app\nSANITY_AUTH_TOKEN=wrong-token\n",
  });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /SANITY_AUTH_TOKEN/);
});
