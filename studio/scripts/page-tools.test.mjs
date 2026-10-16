import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { main, withKeys } from "./seed-page-draft.mjs";
import { normalizeSlug, selectPage, sectionText } from "./lib/page-text.mjs";

test("text selection prefers drafts and supports published-only reads", () => {
  const published = { _id: "page", title: "Live" };
  const draft = { _id: "drafts.page", title: "Work in progress" };
  assert.equal(selectPage([published, draft]), draft);
  assert.equal(selectPage([published, draft], true), published);
  assert.equal(selectPage([published]), published);
  assert.equal(selectPage([draft], true), undefined);
});

test("section text keeps rich text and nested labels", () => {
  assert.equal(sectionText({ title: "Intro", body: [{ _type: "block", children: [{ text: "First" }, { text: " second" }] }], buttons: [{ text: "Read more" }] }), "title: Intro\nFirst second\ntext: Read more");
});

test("section text preserves mixed rich-text item order and table cells", () => {
  const block = (text) => ({ _type: "block", children: [{ text }] });
  const section = {
    body: [
      block("Before"),
      { _type: "callout", title: "Note", body: [block("Inside note")] },
      block("Between"),
      {
        _type: "table",
        rows: [
          { _type: "tableRow", cells: ["Name", "Price"] },
          { _type: "tableRow", cells: ["Camp", "$25"] },
        ],
      },
      block("After"),
    ],
  };
  assert.equal(
    sectionText(section),
    "Before\ntitle: Note\nInside note\nBetween\nName | Price\nCamp | $25\nAfter",
  );
});

test("table text keeps empty cell positions without printing non-text metadata", () => {
  assert.equal(
    sectionText({ rows: [{ cells: ["First", "", "Third"] }], tags: ["internal"], _key: "hidden" }),
    "First |  | Third",
  );
});

test("array keys are stable and existing keys remain", () => {
  const value = [{ _type: "section", children: [{ text: "Example" }] }, { _key: "keep" }];
  assert.deepEqual(withKeys(value), withKeys(value));
  assert.equal(withKeys(value)[1]._key, "keep");
  assert.ok(withKeys(value)[0].children[0]._key);
  assert.equal(value[0]._key, undefined);
});

test("seed dry run never starts a transaction; apply only writes drafts with a revision guard", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "page-tools-"));
  const file = path.join(directory, "seed.mjs");
  await writeFile(file, 'export default { page: { _id: "example", blocks: [] }, documents: [{ _id: "example-faq", _type: "faq", question: "Why?" }] };');
  const calls = [];
  const transaction = {
    patch(id, configure) {
      calls.push(["patch", id]);
      const patch = { ifRevisionId(revision) { calls.push(["revision", revision]); return this; }, set(fields) { calls.push(["fields", fields]); return this; }, unset() { return this; } };
      configure(patch);
    },
    createOrReplace(document) { calls.push(["replace", document._id]); },
    async commit() { calls.push(["commit"]); },
  };
  const client = {
    config: () => ({ projectId: "test", dataset: "test" }),
    fetch: async (_query, { id }) => id.startsWith("drafts.") ? { _id: id, _rev: "revision-1", title: "Keep title", slug: { current: "example" }, blocks: [] } : null,
    transaction() { calls.push(["transaction"]); return transaction; },
  };
  try {
    await main([file], () => client);
    assert.deepEqual(calls, []);
    await main([file, "--apply"], () => client);
    assert.deepEqual(calls.filter(([type]) => ["patch", "replace", "revision", "commit"].includes(type)), [["patch", "drafts.example"], ["revision", "revision-1"], ["patch", "drafts.example-faq"], ["revision", "revision-1"], ["replace", "drafts.example-faq"], ["commit"]]);
    assert.equal(calls.find(([type]) => type === "fields")[1].title, "Keep title");
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("an existing-page seed may omit blocks, and new supporting drafts are created", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "page-tools-"));
  const file = path.join(directory, "seed.mjs");
  await writeFile(file, 'export default { page: { _id: "example", title: "New title" }, documents: [{ _id: "example-faq", _type: "faq" }] };');
  const calls = [];
  const transaction = {
    patch(id, configure) {
      calls.push(["patch", id]);
      configure({ ifRevisionId() { return this; }, set(fields) { calls.push(["fields", fields]); return this; }, unset() { return this; } });
    },
    create(document) { calls.push(["create", document._id]); },
    createOrReplace(document) { calls.push(["replace", document._id]); },
    async commit() { calls.push(["commit"]); },
  };
  const client = {
    config: () => ({ projectId: "test", dataset: "test" }),
    fetch: async (_query, { id }) => id === "drafts.example" ? { _id: id, _rev: "revision-1", title: "Old title", slug: { current: "example" }, blocks: [{ _key: "keep", _type: "section" }] } : null,
    transaction() { return transaction; },
  };
  try {
    await main([file, "--apply"], () => client);
    assert.deepEqual(calls.filter(([type]) => type !== "fields"), [["patch", "drafts.example"], ["create", "drafts.example-faq"], ["commit"]]);
    const fields = calls.find(([type]) => type === "fields")[1];
    assert.equal(fields.title, "New title");
    assert.deepEqual(fields.blocks.map((block) => block._key), ["keep"]);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("page URLs lose their query string and fragment", () => {
  assert.equal(normalizeSlug("https://example.com/about/team?preview=1#top"), "about/team");
  assert.equal(normalizeSlug("/about/"), "about");
});
