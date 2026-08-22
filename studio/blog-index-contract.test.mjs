import assert from "node:assert/strict";
import test from "node:test";

import {
  blocksField,
  legacyBlockTypes,
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
  assert.deepEqual([...pageBuilderBlockTypes], [
    "hero",
    "richTextBlock",
    "ctaBanner",
  ]);
  assert.deepEqual(
    blocksField.of.filter(({ hidden }) => hidden).map(({ type }) => type),
    [...legacyBlockTypes],
  );
  assert.equal(typeof blocksField.components?.input, "function");
  assert.equal(new Set(pageBuilderBlockTypes).size, pageBuilderBlockTypes.length);
});

test("blogIndex uses the singleton configuration", () => {
  assert.equal(singletonDocumentTypes.has("blogIndex"), true);
  assert.equal(singletonDocumentActions.has("duplicate"), false);
  assert.equal(singletonDocumentActions.has("delete"), false);
});
