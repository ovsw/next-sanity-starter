import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  STARTER_DOCUMENT_TYPES,
  STARTER_IMAGE_ASSET_ID,
  seed,
  starterDocuments,
  unseed,
} from "./seed.mjs";

function createFakeClient({
  count = 0,
  documents = starterDocuments,
  assetRefs = [],
} = {}) {
  const calls = {
    commits: [],
    uploads: [],
  };

  const client = {
    calls,
    assets: {
      async upload(type, body, options) {
        calls.uploads.push({ body, options, type });
        return { _id: STARTER_IMAGE_ASSET_ID };
      },
    },
    async fetch(query) {
      if (query.startsWith("count(")) return count;
      if (query.includes(".blocks[].image.asset._ref")) return assetRefs;
      if (query.startsWith("*[_id in $ids]")) return documents;
      throw new Error(`Unexpected query: ${query}`);
    },
    transaction() {
      const operations = [];
      return {
        createIfNotExists(document) {
          operations.push({ document, op: "createIfNotExists" });
          return this;
        },
        delete(id) {
          operations.push({ id, op: "delete" });
          return this;
        },
        async commit() {
          calls.commits.push(operations);
        },
      };
    },
  };

  return client;
}

test("seed writes only after confirming the dataset is empty", async () => {
  const client = createFakeClient();
  const result = await seed(client);

  assert.equal(result.documents, STARTER_DOCUMENT_TYPES.size);
  assert.equal(client.calls.uploads.length, 1);
  assert.equal(client.calls.commits.length, 1);
  assert.deepEqual(
    client.calls.commits[0].map((operation) => operation.document._id),
    starterDocuments.map((document) => document._id),
  );
});

test("seed refuses to write into a non-empty dataset", async () => {
  const client = createFakeClient({ count: 1 });

  await assert.rejects(
    seed(client),
    /destination dataset is not empty \(1 documents found\)/,
  );
  assert.equal(client.calls.uploads.length, 0);
  assert.equal(client.calls.commits.length, 0);
});

test("unseed deletes marked starter IDs and preserves unrelated documents", async () => {
  const client = createFakeClient({
    assetRefs: [STARTER_IMAGE_ASSET_ID, "image-extra-owned"],
  });
  const result = await unseed(client);
  const deletedIds = client.calls.commits[0].map((operation) => operation.id);

  assert.deepEqual(result, {
    assets: 2,
    documents: STARTER_DOCUMENT_TYPES.size,
  });
  assert.deepEqual(deletedIds, [
    ...STARTER_DOCUMENT_TYPES.keys(),
    STARTER_IMAGE_ASSET_ID,
    "image-extra-owned",
  ]);
  assert.equal(deletedIds.includes("unrelated-document"), false);
});

test("unseed refuses unmarked starter IDs", async () => {
  const documents = starterDocuments.map((document) =>
    document._id === "homePage"
      ? { _id: "homePage", _type: "homePage" }
      : document,
  );
  const client = createFakeClient({ documents });

  await assert.rejects(
    unseed(client),
    /homePage/,
  );
  assert.equal(client.calls.commits.length, 0);
});

test("unseed refuses partial starter datasets", async () => {
  const client = createFakeClient({ documents: starterDocuments.slice(1) });

  await assert.rejects(
    unseed(client),
    /missing Starter seed documents: settings/,
  );
  assert.equal(client.calls.commits.length, 0);
});

test("seed reads Studio env directly instead of the legacy root env file", () => {
  const source = readFileSync(new URL("./seed.mjs", import.meta.url), "utf8");

  assert.doesNotMatch(source, /rootDirectory,\s*"\.env\.local"/);
  assert.match(source, /rootDirectory,\s*"studio",\s*"\.env\.local"/);
});
