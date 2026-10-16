import assert from "node:assert/strict";
import test from "node:test";
import { migrate, migrationPlan, stylePaths } from "./migrate-button-lists.mjs";
import { starterDocuments } from "./seed.mjs";

const document = {
  _id: "page", _rev: "revision",
  blocks: [{ _type: "richTextBlock", richText: [{
    _type: "block", style: "h2", markDefs: [{ _type: "buttonLink", variant: "outline", customLink: { external: "https://example.com" } }],
  }] }],
  blocksArchive: [{ _type: "button", variant: "default", text: "Read more" }],
  link: { _type: "link", buttonVariant: "secondary", href: "/about" },
  unrelated: { _type: "card", variant: "wide", buttonVariant: "keep" },
};

test("cleans nested and archived buttons without changing other styles or destinations", () => {
  assert.deepEqual(stylePaths(document), [
    "blocks[0].richText[0].markDefs[0].variant",
    "blocksArchive[0].variant", "link.buttonVariant",
  ]);
  assert.equal(document.blocksArchive[0].variant, "default");
  assert.deepEqual(stylePaths({ _type: "button", text: "Read", url: null }), []);
  assert.deepEqual(migrationPlan(starterDocuments), []);
});

test("dry run reports changes without opening a transaction", async () => {
  const logs = [];
  const client = { fetch: async (_query, _params, options) => {
    assert.equal(options.perspective, "raw");
    return [document];
  }, transaction: () => assert.fail("dry run must not write") };
  await migrate(client, { log: (line) => logs.push(line) });
  assert.match(logs[0], /would patch page.*variant/);
});

test("apply patches each exact draft, published and release ID with revision guards", async () => {
  const ids = ["page", "drafts.page", "versions.release.page"];
  const writes = [];
  let commits = 0;
  const client = {
    fetch: async () => ids.map((_id) => ({ ...document, _id })),
    transaction: () => ({
      patch(id, build) {
        const patch = { ifRevisionId(revision) { assert.equal(revision, "revision"); return this; }, unset(paths) { writes.push({ id, paths }); return this; } };
        build(patch);
      },
      async commit() { commits++; return { transactionId: "test" }; },
    }),
  };
  await migrate(client, { apply: true, log() {} });
  assert.deepEqual(writes.map(({ id }) => id), ids);
  assert.equal(commits, 1);
  assert.ok(writes.every(({ paths }) => paths.length === 3));
});

test("reads in pages and commits in bounded batches", async () => {
  const documents = Array.from({ length: 1201 }, (_, index) => ({
    ...document,
    _id: `page-${String(index).padStart(4, "0")}`,
  }));
  const reads = [];
  const batches = [];
  const client = {
    fetch: async (_query, { after }) => {
      reads.push(after);
      return documents.filter(({ _id }) => _id > after).slice(0, 500);
    },
    transaction: () => {
      const batch = [];
      batches.push(batch);
      return {
        patch(id, build) {
          batch.push(id);
          build({ ifRevisionId() { return this; }, unset() { return this; } });
        },
        async commit() { return { transactionId: "batch" }; },
      };
    },
  };
  const changes = await migrate(client, { apply: true, log() {} });
  assert.deepEqual(reads, ["", "page-0499", "page-0999"]);
  assert.equal(changes.length, 1201);
  assert.equal(batches.length, 13);
  assert.ok(batches.every((batch) => batch.length <= 100));
  assert.deepEqual(batches.flat(), documents.map(({ _id }) => _id));
});

test("a clean dataset needs no transaction on a repeat run", async () => {
  await migrate({ fetch: async () => starterDocuments, transaction: () => assert.fail("nothing to write") }, { apply: true, log() {} });
});

test("migration removes legacy seed styles and is idempotent", async () => {
  const documents = structuredClone(starterDocuments);
  documents[0]._rev = "seed-revision";
  documents[0].legacyAction = { _type: "button", text: "Read", url: { external: "https://example.com" }, variant: "outline" };
  const before = structuredClone(documents[0].legacyAction);
  const client = {
    fetch: async () => documents,
    transaction: () => ({
      patch(id, build) {
        const target = documents.find((entry) => entry._id === id);
        build({
          ifRevisionId(revision) { assert.equal(revision, target._rev); return this; },
          unset(paths) {
            for (const path of paths) {
              const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".");
              const field = parts.pop();
              const parent = parts.reduce((value, part) => value[part], target);
              delete parent[field];
            }
            return this;
          },
        });
      },
      async commit() { return { transactionId: "seed-test" }; },
    }),
  };
  await migrate(client, { apply: true, log() {} });
  const { variant, ...expected } = before;
  assert.equal(variant, "outline");
  assert.deepEqual(documents[0].legacyAction, expected);
  assert.deepEqual(await migrate(client, { apply: true, log() {} }), []);
});
