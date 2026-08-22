import assert from "node:assert/strict";
import { test } from "node:test";

import {
  CATEGORY_PLAN,
  EXPECTED_DISTRIBUTION,
  POST_PLAN,
  buildDistribution,
  buildDryRunReport,
  buildMigrationPlan,
} from "./migrate-category-taxonomy.ts";

const CATEGORY_IDS = Object.keys(CATEGORY_PLAN);

function categoryDoc(id, overrides = {}) {
  const plan = CATEGORY_PLAN[id];
  return {
    _id: id,
    _rev: `rev-${id}`,
    slug: { _type: "slug", current: plan.fromSlug },
    ...overrides,
  };
}

function allCategories(overrides = {}) {
  return CATEGORY_IDS.map((id) => categoryDoc(id, overrides[id] ?? {}));
}

function allPosts() {
  return Object.keys(POST_PLAN).map((slug, index) => ({
    _id: `post-${index}`,
    _rev: `rev-post-${index}`,
    slug: { _type: "slug", current: slug },
  }));
}

function inventory(overrides = {}) {
  return {
    categories: allCategories(),
    drafts: [],
    posts: allPosts(),
    ...overrides,
  };
}

test("the mapping tables are internally consistent", () => {
  assert.equal(Object.keys(POST_PLAN).length, 58);
  assert.equal(CATEGORY_IDS.length, 6);

  const planSlugs = new Set(Object.values(CATEGORY_PLAN).map((e) => e.slug));
  assert.equal(planSlugs.size, 6, "category slugs must be unique");

  for (const target of Object.values(POST_PLAN)) {
    assert.ok(
      planSlugs.has(target),
      `post destination "${target}" is not a planned category slug`,
    );
  }

  const counted = {};
  for (const target of Object.values(POST_PLAN)) {
    counted[target] = (counted[target] ?? 0) + 1;
  }
  assert.deepEqual(
    counted,
    EXPECTED_DISTRIBUTION,
    "EXPECTED_DISTRIBUTION must be derived from POST_PLAN, not hand-written",
  );

  const total = Object.values(EXPECTED_DISTRIBUTION).reduce((a, b) => a + b, 0);
  assert.equal(total, 58);
});

test("every category carries a non-empty description", () => {
  // Indexability needs a description; an empty one leaves the archive noindex.
  for (const [id, plan] of Object.entries(CATEGORY_PLAN)) {
    assert.ok(
      plan.description.trim().length > 80,
      `${id} needs a real description, not a placeholder`,
    );
  }
});

test("plans all six renames and all 58 reassignments from a clean dataset", () => {
  const plan = buildMigrationPlan(inventory());
  assert.equal(plan.fatal.length, 0);
  assert.equal(plan.categories.length, 6);
  assert.equal(plan.posts.length, 58);
  assert.deepEqual(buildDistribution(plan), EXPECTED_DISTRIBUTION);
});

test("carries the revision of every document it patches", () => {
  const plan = buildMigrationPlan(inventory());
  for (const category of plan.categories) {
    assert.equal(category.rev, `rev-${category.id}`);
  }
  for (const post of plan.posts) {
    assert.ok(post.rev.startsWith("rev-post-"));
  }
});

test("is idempotent — a re-run against migrated slugs still plans cleanly", () => {
  const migrated = {};
  for (const id of CATEGORY_IDS) {
    migrated[id] = {
      slug: { _type: "slug", current: CATEGORY_PLAN[id].slug },
    };
  }
  const plan = buildMigrationPlan(
    inventory({ categories: allCategories(migrated) }),
  );
  assert.equal(plan.fatal.length, 0);
  assert.equal(plan.categories.length, 6);
});

test("rejects a category whose slug is neither the old nor the new value", () => {
  const [id] = CATEGORY_IDS;
  const plan = buildMigrationPlan(
    inventory({
      categories: allCategories({
        [id]: { slug: { _type: "slug", current: "something-else" } },
      }),
    }),
  );
  assert.equal(plan.categories.length, 5);
  assert.match(plan.fatal[0].reason, /expected slug/);
});

test("rejects meta.noindex rather than clearing it", () => {
  const [id] = CATEGORY_IDS;
  const plan = buildMigrationPlan(
    inventory({
      categories: allCategories({ [id]: { meta: { noindex: true } } }),
    }),
  );
  assert.equal(plan.categories.length, 5);
  assert.match(plan.fatal[0].reason, /meta\.noindex/);
});

test("meta.noindex false or absent is fine", () => {
  const [id] = CATEGORY_IDS;
  const plan = buildMigrationPlan(
    inventory({
      categories: allCategories({ [id]: { meta: { noindex: false } } }),
    }),
  );
  assert.equal(plan.fatal.length, 0);
  assert.equal(plan.categories.length, 6);
});

test("aborts on any category or post draft", () => {
  const plan = buildMigrationPlan(
    inventory({
      drafts: [
        { _id: "drafts.9c4c1393-afe8-4eb4-b662-a20789de0c1b", _type: "category" },
        { _id: "drafts.post-1", _type: "post" },
      ],
    }),
  );
  assert.equal(plan.fatal.length, 2);
  assert.match(plan.fatal[0].reason, /publish or discard/);
});

test("rejects an unmapped category", () => {
  const plan = buildMigrationPlan(
    inventory({
      categories: [
        ...allCategories(),
        { _id: "stray-id", _rev: "r", slug: { current: "stray" } },
      ],
    }),
  );
  assert.match(
    plan.fatal.find((f) => f.id === "stray-id").reason,
    /unmapped category/,
  );
});

test("reports a mapped category missing from the dataset", () => {
  const [dropped, ...kept] = CATEGORY_IDS;
  const plan = buildMigrationPlan(
    inventory({ categories: kept.map((id) => categoryDoc(id)) }),
  );
  assert.match(
    plan.fatal.find((f) => f.id === dropped).reason,
    /missing from the dataset/,
  );
});

test("rejects a post whose slug is not in the mapping", () => {
  const plan = buildMigrationPlan(
    inventory({
      posts: [
        ...allPosts(),
        { _id: "post-new", _rev: "r", slug: { current: "brand-new-post" } },
      ],
    }),
  );
  assert.match(
    plan.fatal.find((f) => f.id === "post-new").reason,
    /is unmapped/,
  );
});

test("rejects a post with no slug", () => {
  const plan = buildMigrationPlan(
    inventory({
      posts: [...allPosts(), { _id: "post-noslug", _rev: "r" }],
    }),
  );
  assert.match(
    plan.fatal.find((f) => f.id === "post-noslug").reason,
    /no slug/,
  );
});

test("reports a mapping key that matches no post — the under-migration case", () => {
  const posts = allPosts();
  const removed = posts.pop();
  const removedSlug = removed.slug.current;
  const plan = buildMigrationPlan(inventory({ posts }));
  assert.match(
    plan.fatal.find((f) => f.id === removedSlug).reason,
    /matches no post/,
  );
});

test("dry-run report states the mode and surfaces the distribution", () => {
  const plan = buildMigrationPlan(inventory());
  const report = buildDryRunReport(plan);
  assert.equal(report.mode, "dry-run");
  assert.equal(report.dataset, "development");
  assert.equal(report.summary.posts, 58);
  assert.equal(report.summary.fatal, 0);
  assert.deepEqual(report.distribution, report.expectedDistribution);

  assert.equal(buildDryRunReport(plan, true).mode, "apply");
});
