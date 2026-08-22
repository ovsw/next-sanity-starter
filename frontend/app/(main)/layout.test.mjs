import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const layoutSource = readFileSync(new URL("./layout.tsx", import.meta.url), "utf8");

function mustFind(pattern) {
  const index = layoutSource.search(pattern);
  assert.notEqual(index, -1, String(pattern));
  return index;
}

test("draft mode gets live drafts and click-to-edit without exposing drafts publicly", () => {
  assert.match(layoutSource, /const \{ isEnabled: isDraftMode \} = await draftMode\(\)/);
  assert.match(
    layoutSource,
    /\{isDraftMode && \([\s\S]*<DisableDraftMode \/>[\s\S]*<VisualEditing \/>[\s\S]*\)\}/,
  );
});

test("published visitors keep Sanity cache invalidation active", () => {
  const mainContent = mustFind(/<main id="main-content"/);
  const sanityLive = mustFind(/<SanityLive includeDrafts=\{isDraftMode\} \/>/);
  const draftControls = mustFind(/\{isDraftMode && \(/);

  assert.ok(mainContent < sanityLive);
  assert.ok(sanityLive < draftControls);
});
