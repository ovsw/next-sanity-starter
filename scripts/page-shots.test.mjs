import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { assertDraftSections, parseArgs, removeSectionShots } from "./page-shots.mjs";

test("page shots parses nested slugs and options in either order", () => {
  assert.deepEqual(parseArgs(["--only", "phone", "/about/team/", "--out", "/tmp/review"]), {
    only: "phone", slug: "about/team", out: "/tmp/review",
  });
});

test("page shots rejects missing and unsupported arguments", () => {
  for (const args of [[], ["/"], ["about", "--out"], ["about", "--only", "tablet"], ["about", "extra"], ["--bad"]]) {
    assert.throws(() => parseArgs(args));
  }
});

test("published mode cannot pass even with the same section keys", () => {
  assert.throws(() => assertDraftSections(["a"], ["a"], false, "drafts.page"), /draft mode is off/);
});

test("missing, extra, reordered and empty sections stop screenshots", () => {
  for (const rendered of [[], ["a"], ["b", "a"], ["a", "b", "c"]]) {
    assert.throws(() => assertDraftSections(["a", "b"], rendered, true, "drafts.page"), /Refusing screenshots/);
  }
  assert.throws(() => assertDraftSections([], [], true, "drafts.page"));
  assert.doesNotThrow(() => assertDraftSections(["a", "b"], ["a", "b"], true, "drafts.page"));
});

test("a new capture removes earlier section images and keeps other files", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "page-shots-"));
  try {
    for (const file of ["01-hero.png", "02-old.png", "100-last.png", "notes.png", "readme.txt"]) {
      writeFileSync(path.join(directory, file), "");
    }
    removeSectionShots(directory);
    assert.deepEqual(readdirSync(directory).sort(), ["notes.png", "readme.txt"]);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
