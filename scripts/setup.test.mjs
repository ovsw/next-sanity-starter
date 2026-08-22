import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildEnvironmentFiles,
  validateSetupValues,
  writeSetupFiles,
} from "./setup.mjs";

const values = {
  dataset: "production",
  projectId: "abc12345",
  siteName: "Example Company",
  siteUrl: "https://example.com/",
  studioHostname: "example-studio.sanity.studio",
};

test("validates and normalizes the five required values", () => {
  assert.deepEqual(validateSetupValues(values), {
    ...values,
    siteUrl: "https://example.com",
    studioHostname: "example-studio",
  });
  assert.throws(
    () => validateSetupValues({ ...values, projectId: "" }),
    /Missing required value: Sanity project ID/,
  );
  assert.throws(
    () => validateSetupValues({ ...values, siteUrl: "example.com" }),
    /Public URL must be a valid http or https URL/,
  );
});

test("builds local configuration without tokens or shared identifiers", () => {
  const files = buildEnvironmentFiles(values, "test-secret");
  assert.match(files.frontend, /NEXT_PUBLIC_SITE_NAME="Example Company"/);
  assert.match(files.frontend, /NEXT_PUBLIC_SANITY_PROJECT_ID=abc12345/);
  assert.match(files.frontend, /OG_IMAGE_SECRET=test-secret/);
  assert.match(files.studio, /SANITY_STUDIO_HOSTNAME=example-studio/);
  assert.doesNotMatch(`${files.frontend}${files.studio}`, /SANITY_AUTH_TOKEN/);
});

test("writes ignored env files and refuses to replace them by default", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "starter-setup-"));
  try {
    await writeSetupFiles(directory, values);
    const frontend = await readFile(
      path.join(directory, "frontend", ".env.local"),
      "utf8",
    );
    assert.match(frontend, /NEXT_PUBLIC_SITE_URL=https:\/\/example\.com/);
    await assert.rejects(
      writeSetupFiles(directory, values),
      /frontend\/\.env\.local already exists/,
    );
  } finally {
    await rm(directory, { recursive: true });
  }
});
