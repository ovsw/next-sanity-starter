import assert from "node:assert/strict";
import test from "node:test";

import { uniqueCategorySlug } from "./unique-category-slug.ts";

function createContext({ documentId = "drafts.category-id", fetch = async () => null } = {}) {
  let perspective;
  return {
    document: { _id: documentId },
    getClient: () => ({
      withConfig: (config) => {
        perspective = config.perspective;
        return { fetch };
      },
    }),
    get perspective() {
      return perspective;
    },
  };
}

test("accepts a lowercase kebab-case category slug", async () => {
  const context = createContext();

  assert.equal(
    await uniqueCategorySlug({ current: "loan-types" }, context),
    true,
  );
  assert.equal(context.perspective, "raw");
});

test("rejects numeric-only category slugs separately", async () => {
  const result = await uniqueCategorySlug(
    { current: "2" },
    createContext(),
  );

  assert.match(result, /only numbers/);
});

test("rejects slugs that are not lowercase kebab-case", async () => {
  for (const current of [
    "Loan-Types",
    "loan_types",
    "/loan-types/",
    "-loan-types",
    "loan-types-",
    "loan--types",
  ]) {
    const result = await uniqueCategorySlug({ current }, createContext());
    assert.match(result, /lowercase letters/);
  }
});

test("rejects a duplicate category slug", async () => {
  const result = await uniqueCategorySlug(
    { current: "loan-types" },
    createContext({
      fetch: async () => ({ _id: "other-category", slug: "loan-types" }),
    }),
  );

  assert.equal(
    result,
    "This slug is already used by another category: loan-types",
  );
});

test("catches a duplicate that exists only as a draft", async () => {
  const context = createContext({
    fetch: async () => ({
      _id: "drafts.other-category",
      slug: "loan-types",
    }),
  });

  assert.match(
    await uniqueCategorySlug({ current: "loan-types" }, context),
    /already used by another category/,
  );
  assert.equal(context.perspective, "raw");
});

test("excludes the current published and draft IDs from collision checks", async () => {
  let query;
  let params;
  const context = createContext({
    documentId: "drafts.category-id",
    fetch: async (receivedQuery, receivedParams) => {
      query = receivedQuery;
      params = receivedParams;
      return null;
    },
  });

  assert.equal(
    await uniqueCategorySlug({ current: "loan-types" }, context),
    true,
  );
  assert.match(query, /_type == "category"/);
  // versionOf covers published, draft, AND versions.<releaseId>. documents; an
  // id-list exclusion would miss release versions under the raw perspective.
  assert.match(query, /!sanity::versionOf\(\$publishedId\)/);
  assert.deepEqual(params, {
    publishedId: "category-id",
    slug: "loan-types",
  });
});

test("normalises a release version id down to the published id", () => {
  let params;
  const context = createContext({
    documentId: "versions.rAbC123.category-id",
    fetch: async (_query, receivedParams) => {
      params = receivedParams;
      return null;
    },
  });

  return uniqueCategorySlug({ current: "loan-types" }, context).then(() => {
    // sanity::versionOf rejects anything but a published id.
    assert.equal(params.publishedId, "category-id");
  });
});
