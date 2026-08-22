import assert from "node:assert/strict";
import test from "node:test";

import { requireStudioDataset } from "./environment.ts";

test("requires an explicit Sanity Studio dataset", () => {
  for (const value of [undefined, "", "   "]) {
    assert.throws(
      () => requireStudioDataset(value),
      /SANITY_STUDIO_DATASET is required/,
    );
  }
});

test("returns the configured Sanity Studio dataset", () => {
  assert.equal(requireStudioDataset("development"), "development");
});
