import assert from "node:assert/strict";
import test from "node:test";

import { singleFaqBlock } from "./single-faq-block.ts";

test("allows no FAQ sections", () => {
  assert.equal(singleFaqBlock([]), true);
});

test("allows one FAQ section", () => {
  assert.equal(singleFaqBlock([{ _type: "faqAccordion" }]), true);
});

test("rejects two FAQ sections", () => {
  assert.equal(
    singleFaqBlock([
      { _type: "faqAccordion" },
      { _type: "richTextBlock" },
      { _type: "faqAccordion" },
    ]),
    "Only one FAQ section per page.",
  );
});
