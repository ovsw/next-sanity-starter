import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { main, withKeys } from "./seed-page-draft.mjs";
import { selectPage, sectionText } from "./lib/page-text.mjs";

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
      const patch = { ifRevisionId(revision) { calls.push(["revision", revision]); return this; }, set(fields) { calls.push(["fields", fields]); return this; } };
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
    assert.deepEqual(calls.filter(([type]) => ["patch", "replace", "revision", "commit"].includes(type)), [["patch", "drafts.example"], ["revision", "revision-1"], ["replace", "drafts.example-faq"], ["commit"]]);
    assert.equal(calls.find(([type]) => type === "fields")[1].title, "Keep title");
  } finally { await rm(directory, { recursive: true, force: true }); }
});
