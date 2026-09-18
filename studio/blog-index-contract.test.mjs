import assert from "node:assert/strict";
import test from "node:test";

import {
  blocksArchiveField,
  blocksField,
  contentBlocksArchiveField,
  contentBlocksField,
  contentPageBuilderBlockTypes,
  homePageBlocksArchiveField,
  homePageBlocksField,
  pageBuilderBlockTypes,
} from "./schemas/blocks/page-builder.ts";
import {
  singletonDocumentActions,
  singletonDocumentTypes,
} from "./singletons.ts";

test("the shared blocks field exactly matches its authoritative inventory", () => {
  assert.deepEqual(
    blocksField.of.filter(({ hidden }) => !hidden).map(({ type }) => type),
    [...pageBuilderBlockTypes],
  );
  assert.deepEqual(
    [...pageBuilderBlockTypes],
    ["richTextBlock", "scaffold"],
  );
  assert.equal(
    blocksField.of.some(({ hidden }) => hidden),
    false,
  );
  assert.equal(
    new Set(pageBuilderBlockTypes).size,
    pageBuilderBlockTypes.length,
  );
});

test("every blocks archive accepts exactly the block types of its blocks field", () => {
  for (const [blocks, archive] of [
    [blocksField, blocksArchiveField],
    [contentBlocksField, contentBlocksArchiveField],
    [homePageBlocksField, homePageBlocksArchiveField],
  ]) {
    assert.equal(archive.name, "blocksArchive");
    assert.deepEqual(
      archive.of.map(({ type }) => type),
      blocks.of.map(({ type }) => type),
    );
    assert.equal(archive.fieldset, "blocksArchive");
  }
});

test("blogIndex uses the singleton configuration", () => {
  assert.deepEqual(
    contentBlocksField.of
      .filter(({ hidden }) => !hidden)
      .map(({ type }) => type),
    [...contentPageBuilderBlockTypes],
  );
  assert.equal(singletonDocumentTypes.has("blogIndex"), true);
  assert.equal(singletonDocumentActions.has("duplicate"), false);
  assert.equal(singletonDocumentActions.has("delete"), false);
});
