import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
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
  readToken: "read-token",
  sanityAuthToken: "auth-token",
  siteName: "Example Company",
  siteUrl: "https://example.com/",
  studioHostname: "example-studio.sanity.studio",
};

test("validates and normalizes the required values", () => {
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
    () => validateSetupValues({ ...values, readToken: "" }),
    /Missing required value: Sanity API read token/,
  );
  assert.throws(
    () => validateSetupValues({ ...values, sanityAuthToken: "" }),
    /Missing required value: Sanity auth token/,
  );
  assert.throws(
    () => validateSetupValues({ ...values, siteUrl: "example.com" }),
    /Public URL must be a valid http or https URL/,
  );
});

test("builds local configuration without shared identifiers", () => {
  const files = buildEnvironmentFiles(values, "test-secret");
  assert.match(files.frontend, /NEXT_PUBLIC_SITE_NAME="Example Company"/);
  assert.match(files.frontend, /NEXT_PUBLIC_SANITY_PROJECT_ID=abc12345/);
  assert.match(files.frontend, /OG_IMAGE_SECRET=test-secret/);
  assert.match(files.frontend, /SANITY_API_READ_TOKEN=read-token/);
  assert.match(files.studio, /SANITY_STUDIO_HOSTNAME=example-studio/);
  assert.match(files.studio, /SANITY_AUTH_TOKEN=auth-token/);
});

test("writes ignored env files and refuses to replace them by default", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "starter-setup-"));
  try {
    await writeSetupFiles(directory, values);
    const frontend = await readFile(
      path.join(directory, "frontend", ".env.local"),
      "utf8",
    );
    const frontendMode = (await stat(
      path.join(directory, "frontend", ".env.local"),
    )).mode & 0o777;
    const studioMode = (await stat(
      path.join(directory, "studio", ".env.local"),
    )).mode & 0o777;
    assert.match(frontend, /NEXT_PUBLIC_SITE_URL=https:\/\/example\.com/);
    assert.equal(frontendMode, 0o600);
    assert.equal(studioMode, 0o600);
    await assert.rejects(
      writeSetupFiles(directory, values),
      /(frontend|studio)\/\.env\.local already exists/,
    );
  } finally {
    await rm(directory, { recursive: true });
  }
});
