import assert from "node:assert/strict";
import test from "node:test";

import {
  CATEGORY_SLUGS,
  TAXONOMY_SLUGS,
  buildDryRunReport,
  buildMigrationPlan,
  buildTargetTypes,
  classifyPost,
} from "./migrate-post-category.ts";

const categoryId = Object.keys(CATEGORY_SLUGS)[0];
const targetTypes = new Map([
  [categoryId, "category"],
  ["wrong-type", "author"],
]);

function post(overrides = {}) {
  return {
    _id: "post-1",
    _rev: "rev-1",
    categories: [
      { _key: "array-key", _type: "reference", _ref: categoryId },
    ],
    ...overrides,
  };
}

function categories(overrides = {}) {
  return Object.entries(CATEGORY_SLUGS).map(([id, slug]) => ({
    _id: id,
    _rev: `rev-${id}`,
    slug: { _type: "slug", current: slug },
    ...(id === categoryId ? overrides : {}),
  }));
}

test("builds a clean revision-guarded post mutation for dry-run output", () => {
  const result = classifyPost(post(), targetTypes);
  assert.equal(result.status, "migratable");
  assert.equal(result.expectedCategoryRef, categoryId);
  assert.deepEqual(result.mutation, {
    id: "post-1",
    ifRevisionId: "rev-1",
    set: { category: { _type: "reference", _ref: categoryId } },
    unset: ["categories"],
  });
  assert.equal("_key" in result.mutation.set.category, false);
});

test("uses explicit raw-query presence flags instead of projected nulls", () => {
  const legacy = classifyPost(
    post({ _hasCategories: true, _hasCategory: false, category: null }),
    targetTypes,
  );
  assert.equal(legacy.status, "migratable");

  const migrated = classifyPost(
    post({
      _hasCategories: false,
      _hasCategory: true,
      categories: null,
      category: { _type: "reference", _ref: categoryId },
    }),
    targetTypes,
  );
  assert.equal(migrated.status, "already-migrated");
});

test("classifies a mixed published and draft batch", () => {
  const migratedDraft = post({
    _id: "drafts.post-1",
    _rev: "draft-rev",
    category: { _type: "reference", _ref: categoryId },
  });
  delete migratedDraft.categories;
  const plan = buildMigrationPlan(
    [
      post(),
      migratedDraft,
    ],
    categories(),
    targetTypes,
  );
  assert.deepEqual(plan.summary.posts, { migrated: 1, skipped: 1, fatal: 0 });
  assert.equal(plan.postMutations.length, 1);
});

test("rejects zero, multiple, malformed, dangling, and wrong-type references", () => {
  const cases = [
    post({ categories: [] }),
    post({ categories: [
      { _type: "reference", _ref: categoryId },
      { _type: "reference", _ref: categoryId },
    ] }),
    post({ categories: [{ _ref: categoryId }] }),
    post({ categories: [{ _type: "reference", _ref: "missing" }] }),
    post({ categories: [{ _type: "reference", _ref: "wrong-type" }] }),
  ];
  for (const value of cases) {
    assert.equal(classifyPost(value, targetTypes).status, "fatal");
  }
});

test("unsets agreeing legacy data and rejects conflicting fields", () => {
  const agreeing = classifyPost(
    post({ category: { _type: "reference", _ref: categoryId } }),
    targetTypes,
  );
  assert.equal(agreeing.status, "already-migrated");
  assert.deepEqual(agreeing.mutation, {
    id: "post-1",
    ifRevisionId: "rev-1",
    unset: ["categories"],
  });

  const conflicting = classifyPost(
    post({ category: { _type: "reference", _ref: "wrong-type" } }),
    targetTypes,
  );
  assert.equal(conflicting.status, "fatal");
});

test("rejects a valid conflicting category reference", () => {
  const otherId = "other-category";
  const types = new Map([...targetTypes, [otherId, "category"]]);
  const result = classifyPost(
    post({ category: { _type: "reference", _ref: otherId } }),
    types,
  );
  assert.equal(result.status, "fatal");
  assert.match(result.reason, /conflicts/);
});

test("patches every existing mapped draft and published category version", () => {
  const plan = buildMigrationPlan(
    [post()],
    [
      ...categories({ slug: { _type: "slug", current: "/old" } }),
      {
        _id: `drafts.${categoryId}`,
        _rev: "draft-category-rev",
        slug: { _type: "slug", current: "old" },
      },
    ],
    targetTypes,
  );
  const mutations = plan.categoryMutations.filter(
    (mutation) => mutation.id.replace(/^drafts\./, "") === categoryId,
  );
  assert.equal(mutations.length, 2);
  assert.deepEqual(
    mutations.map(({ ifRevisionId }) => ifRevisionId).sort(),
    ["draft-category-rev", `rev-${categoryId}`].sort(),
  );
});

test("rejects slug conflicts across published and draft pairs", () => {
  const extra = {
    _id: "unmapped-category",
    _rev: "extra-rev",
    slug: { _type: "slug", current: CATEGORY_SLUGS[categoryId] },
  };
  const plan = buildMigrationPlan([post()], [...categories(), extra], targetTypes);
  assert.equal(plan.summary.categories.fatal, 1);
  assert.match(plan.fatal[0].reason, /conflicts|already used/);
});

test("rejects an unmapped category without a valid slug", () => {
  const plan = buildMigrationPlan(
    [post()],
    [...categories(), { _id: "unmapped", _rev: "rev", slug: null }],
    targetTypes,
  );
  assert.equal(plan.summary.categories.fatal, 1);
  assert.match(plan.fatal[0].reason, /unmapped/);
});

test("rejects a mapped category with no published or draft version", () => {
  const plan = buildMigrationPlan(
    [post()],
    categories().filter((category) => category._id !== categoryId),
    targetTypes,
  );
  assert.ok(
    plan.fatal.some(
      ({ id, reason }) =>
        id === categoryId && reason.includes("no published or draft document"),
    ),
  );
});

test("accepts a valid unmapped draft-only category", () => {
  const plan = buildMigrationPlan(
    [post()],
    [
      ...categories(),
      {
        _id: "drafts.unmapped-category",
        _rev: "draft-only-rev",
        slug: { _type: "slug", current: "draft-only-category" },
      },
    ],
    targetTypes,
  );
  assert.equal(plan.summary.categories.fatal, 0);
  assert.ok(
    plan.categories.some(
      ({ id, status }) =>
        id === "drafts.unmapped-category" && status === "already-migrated",
    ),
  );
});

test("rejects a proposed slug already held by another raw category pair", () => {
  const otherMappedId = Object.keys(CATEGORY_SLUGS)[1];
  const currentConflict = categories().map((category) =>
    category._id === otherMappedId
      ? {
          ...category,
          slug: { _type: "slug", current: CATEGORY_SLUGS[categoryId] },
        }
      : category,
  );
  const plan = buildMigrationPlan([post()], currentConflict, targetTypes);
  assert.ok(plan.fatal.some(({ reason }) => reason.includes("already used")));
});

test("resolves draft-only category targets by their published reference id", () => {
  assert.equal(
    buildTargetTypes([{ _id: `drafts.${categoryId}`, _type: "category" }]).get(
      categoryId,
    ),
    "category",
  );
});

test("reports the full guarded mutation set in dry-run mode", () => {
  const plan = buildMigrationPlan(
    [post()],
    categories({ slug: { _type: "slug", current: "old-slug" } }),
    targetTypes,
  );
  const report = buildDryRunReport(plan);
  assert.equal(report.projectId, "hv0545v9");
  assert.equal(report.dataset, "development");
  assert.equal(report.mode, "dry-run");
  assert.equal(report.mutations.posts.length, 1);
  assert.equal(report.mutations.posts[0].ifRevisionId, "rev-1");
  assert.ok(report.mutations.categories.length > 0);
});

test("is idempotent after category fields and slugs are migrated", () => {
  const migratedPost = post({
    categories: undefined,
    category: { _type: "reference", _ref: categoryId },
  });
  delete migratedPost.categories;
  const plan = buildMigrationPlan([migratedPost], categories(), targetTypes);
  assert.deepEqual(plan.summary, {
    posts: { migrated: 0, skipped: 1, fatal: 0 },
    categories: { migrated: 0, skipped: 6, fatal: 0 },
  });
  assert.equal(plan.postMutations.length, 0);
  assert.equal(plan.categoryMutations.length, 0);
  assert.deepEqual(plan.fatal, []);
});

test("aborts when the taxonomy migration has already renamed a category", () => {
  // migrate-category-taxonomy.ts supersedes this script. Re-running it against a
  // migrated dataset would rewrite the new slugs back to the old ones, reverting
  // the rename and orphaning the legacy category redirects.
  const [renamedId, renamedSlug] = Object.entries(TAXONOMY_SLUGS)[0];
  const migrated = Object.entries(CATEGORY_SLUGS).map(([id, slug]) => ({
    _id: id,
    _rev: `rev-${id}`,
    slug: { _type: "slug", current: id === renamedId ? renamedSlug : slug },
  }));

  const plan = buildMigrationPlan([post()], migrated, targetTypes);
  const fatal = plan.categories.find(
    (category) => category.id === renamedId && category.status === "fatal",
  );
  assert.ok(fatal, "a renamed category must classify as fatal");
  assert.match(fatal.reason, /superseded|already migrated/);
});

test("TAXONOMY_SLUGS omits loan-types, whose slug the rename left unchanged", () => {
  // Its presence would prove nothing: it reads the same before and after.
  assert.equal(TAXONOMY_SLUGS["9e74332a-7a4e-4322-bd00-91dd80c29e94"], undefined);
  assert.equal(
    CATEGORY_SLUGS["9e74332a-7a4e-4322-bd00-91dd80c29e94"],
    "loan-types",
  );
  for (const [id, slug] of Object.entries(TAXONOMY_SLUGS)) {
    assert.notEqual(slug, CATEGORY_SLUGS[id], `${id} must actually change`);
  }
});
