import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const releaseGate = await readFile(
  new URL("../.github/workflows/release-gate.yml", import.meta.url),
  "utf8",
);
const playwrightConfig = await readFile(
  new URL("../frontend/playwright.config.ts", import.meta.url),
  "utf8",
);

test("the default verification command includes the headless Chrome smoke test", () => {
  assert.match(
    packageJson.scripts.verify,
    /PLAYWRIGHT_REUSE_BUILD=1 pnpm test:smoke$/,
  );
  assert.equal(packageJson.scripts["verify:browser"], undefined);
});

test("the release gate installs Chrome before verification", () => {
  const install = releaseGate.indexOf("playwright install --with-deps chrome");
  const verify = releaseGate.indexOf("run: pnpm verify");

  assert.notEqual(install, -1);
  assert.notEqual(verify, -1);
  assert.ok(install < verify);
});

test("Playwright uses headless Chrome without capture artifacts", () => {
  assert.match(playwrightConfig, /channel: "chrome"/);
  assert.match(playwrightConfig, /headless: true/);
  assert.match(playwrightConfig, /screenshot: "off"/);
  assert.match(playwrightConfig, /trace: "off"/);
  assert.match(playwrightConfig, /video: "off"/);
});
