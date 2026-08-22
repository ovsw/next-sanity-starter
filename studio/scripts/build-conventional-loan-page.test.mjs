import assert from "node:assert/strict";
import test from "node:test";

import {
  CONVENTIONAL_LOAN_CONTENT,
  buildConventionalLoanMutation,
  isAlreadyApplied,
  validatePageBeforeBuild,
} from "./build-conventional-loan-page.ts";

const source = {
  _id: "convenionalLoan",
  _rev: "current-revision",
  _type: "page",
  slug: { _type: "slug", current: "/phoenix-conventional-loan" },
  title: "Phoenix Conventional Mortgage Loan",
};

test("accepts only the published conventional loan page", () => {
  assert.equal(validatePageBeforeBuild(source), undefined);
  assert.match(validatePageBeforeBuild(undefined), /does not exist/);
  assert.match(validatePageBeforeBuild({ ...source, _type: "post" }), /Expected the published page/);
  assert.match(validatePageBeforeBuild({ ...source, _rev: "" }), /revision is required/);
  assert.match(
    validatePageBeforeBuild({ ...source, slug: { current: "/other" } }),
    /slug.current must be/,
  );
});

test("builds one revision-guarded mutation targeting the page content fields", () => {
  const mutation = buildConventionalLoanMutation(source);
  assert.equal(mutation.id, "convenionalLoan");
  assert.equal(mutation.ifRevisionID, "current-revision");
  assert.deepEqual(Object.keys(mutation.set).sort(), ["blocks", "meta", "showQuickNav"]);
});

test("detects an already-applied document", () => {
  assert.equal(isAlreadyApplied(source), false);
  assert.equal(isAlreadyApplied({ ...source, ...CONVENTIONAL_LOAN_CONTENT }), true);
});

test("composes the eight page sections in reading order", () => {
  assert.deepEqual(
    CONVENTIONAL_LOAN_CONTENT.blocks.map((block) => block._type),
    [
      "pageHeader",
      "editorialChapter",
      "comparisonTable",
      "benefitCards",
      "comparisonTable",
      "ctaBanner",
      "advisorCta",
      "awardCta",
    ],
  );
});

test("labels exactly the five quick-nav sections", () => {
  const labels = CONVENTIONAL_LOAN_CONTENT.blocks
    .map((block) => block.sectionNav?.navLabel)
    .filter(Boolean);
  assert.deepEqual(labels, [
    "What they are",
    "Conforming vs. non-conforming",
    "Advantages",
    "Requirements",
    "Why conventional",
  ]);
});

test("every array item carries a _key, unique within its array", () => {
  const walk = (value, path) => {
    if (Array.isArray(value)) {
      const keys = [];
      for (const item of value) {
        if (item && typeof item === "object") {
          assert.ok(item._key, `array item at ${path} is missing _key`);
          keys.push(item._key);
        }
        walk(item, path);
      }
      assert.equal(new Set(keys).size, keys.length, `duplicate _key in array at ${path}`);
      return;
    }
    if (value && typeof value === "object") {
      for (const [field, child] of Object.entries(value)) walk(child, `${path}.${field}`);
    }
  };
  walk(CONVENTIONAL_LOAN_CONTENT.blocks, "blocks");
});

test("comparison tables have uniform row widths", () => {
  for (const block of CONVENTIONAL_LOAN_CONTENT.blocks) {
    if (block._type !== "comparisonTable") continue;
    const widths = block.table.rows.map((row) => row.cells.length);
    assert.ok(widths[0] >= 2, `${block._key} needs a feature column plus an option column`);
    assert.ok(widths.length >= 2, `${block._key} needs a header row plus a feature row`);
    assert.ok(
      widths.every((width) => width === widths[0]),
      `${block._key} rows are not uniform`,
    );
  }
});

test("lucide icons ship their svg artwork", () => {
  const [cards] = CONVENTIONAL_LOAN_CONTENT.blocks
    .filter((block) => block._type === "benefitCards")
    .map((block) => block.cards);
  assert.equal(cards.length, 3);
  for (const card of cards) {
    assert.match(card.icon.svg, /^<svg [^>]*class="lucide lucide-[a-z-]+"[^>]*>.*<\/svg>$/);
    assert.ok(card.icon.svg.includes(`lucide-${card.icon.name}"`));
  }
});

test("carries the 2026 fact-checked figures and none of the stale 2021 ones", () => {
  const text = JSON.stringify(CONVENTIONAL_LOAN_CONTENT);
  for (const current of ["$832,750", "1.25% to 3.3%", "HomeReady", "10–20%"]) {
    assert.ok(text.includes(current), `missing current figure ${current}`);
  }
  for (const stale of ["$548,250", "2021", "1.4 to 2.3", "20–40%", "$6,000"]) {
    assert.ok(!text.includes(stale), `stale figure ${stale} present`);
  }
});
