import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const layoutSource = readFileSync(new URL("./layout.tsx", import.meta.url), "utf8");

test("draft mode gets live drafts and click-to-edit without exposing drafts publicly", () => {
  assert.match(layoutSource, /const \{ isEnabled: isDraftMode \} = await draftMode\(\)/);
  assert.match(layoutSource, /<SanityLive includeDrafts=\{isDraftMode\} \/>/);
  assert.match(layoutSource, /isDraftMode && \(/);
  assert.match(layoutSource, /<VisualEditing \/>/);
  assert.match(layoutSource, /<DisableDraftMode \/>/);
});

test("published visitors keep Sanity cache invalidation active", () => {
  assert.match(layoutSource, /<SanityLive includeDrafts=\{isDraftMode\} \/>/);
});
