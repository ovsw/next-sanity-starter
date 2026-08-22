import assert from "node:assert/strict";
import { test } from "node:test";
import { validateHelpCard } from "./schemas/blocks/loan-feature-cards.ts";

const complete = {
  title: "Not sure which fits?",
  body: "Tell us what matters to you.",
  ctaLabel: "Ask us",
  ctaLink: { type: "external", external: "#contact" },
};

test("passes when the help card is complete", () => {
  assert.equal(validateHelpCard(complete, true), true);
});

test("passes when the toggle is off, even with no content", () => {
  assert.equal(validateHelpCard(undefined, false), true);
});

test("treats a missing toggle as on, since legacy documents still render the card", () => {
  assert.notEqual(validateHelpCard(undefined, undefined), true);
});

test("reports every missing field", () => {
  const message = validateHelpCard({}, true);
  assert.equal(typeof message, "string");
  for (const label of ["a heading", "body copy", "a button label", "a button link"]) {
    assert.ok(message.includes(label), `expected message to mention ${label}`);
  }
});

test("reports only the field that is missing", () => {
  const message = validateHelpCard({ ...complete, ctaLabel: undefined }, true);
  assert.ok(message.includes("a button label"));
  assert.ok(!message.includes("a heading"));
});

test("treats whitespace-only strings as missing", () => {
  const message = validateHelpCard({ ...complete, title: "   " }, true);
  assert.ok(message.includes("a heading"));
});
