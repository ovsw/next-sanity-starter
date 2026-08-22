import assert from "node:assert/strict";
import test from "node:test";

import {
  blocksField,
  contentBlocksField,
  contentPageBuilderBlockTypes,
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
    "benefitCards",
    "storyFeature",
    "latestArticles",
    "faqAccordion",
    "teamMembers",
    "ctaBanner",
  ]);
  assert.equal(blocksField.of.some(({ hidden }) => hidden), false);
  assert.equal(new Set(pageBuilderBlockTypes).size, pageBuilderBlockTypes.length);
});

test("blogIndex uses the singleton configuration", () => {
  assert.deepEqual(
    contentBlocksField.of
      .filter(({ hidden }) => !hidden)
      .map(({ type }) => type),
    [...contentPageBuilderBlockTypes],
  );
  assert.equal(contentPageBuilderBlockTypes.includes("hero"), false);
  assert.equal(singletonDocumentTypes.has("blogIndex"), true);
  assert.equal(singletonDocumentActions.has("duplicate"), false);
  assert.equal(singletonDocumentActions.has("delete"), false);
});
