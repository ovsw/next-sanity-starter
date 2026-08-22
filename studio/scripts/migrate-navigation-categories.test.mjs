import assert from "node:assert/strict";
import { test } from "node:test";

import {
  EXPECTED_CATEGORY_SLUGS,
  NAVIGATION_LINK_PLAN,
  buildDryRunReport,
  buildNavigationPlan,
} from "./migrate-navigation-categories.ts";

const KEYS = Object.keys(NAVIGATION_LINK_PLAN);

function categories(overrides = {}) {
  return Object.entries(EXPECTED_CATEGORY_SLUGS).map(([_id, slug]) => ({
    _id,
    slug: { _type: "slug", current: overrides[_id] ?? slug },
  }));
}

function link(key, overrides = {}) {
  const plan = NAVIGATION_LINK_PLAN[key];
  return {
    _key: key,
    _type: "navigationChildLink",
    // Pre-migration state: an internal reference with a stale label.
    label: "Stale Label",
    description: "Stale description.",
    destination: {
      _type: "navigationDestination",
      kind: "internal",
      internal: { _type: "reference", _ref: plan.categoryId },
      openInNewTab: false,
    },
    ...overrides,
  };
}

function navigation(links = KEYS.map((key) => link(key))) {
  return {
    _id: "navigation",
    _rev: "rev-nav",
    items: [
      { _key: "about-us", _type: "navigationGroup", links: [] },
      { _key: "blog", _type: "navigationGroup", links },
    ],
  };
}

test("the plan covers exactly the five blog category links", () => {
  assert.equal(KEYS.length, 5);
  assert.equal(Object.keys(EXPECTED_CATEGORY_SLUGS).length, 5);
  const ids = new Set(Object.values(NAVIGATION_LINK_PLAN).map((p) => p.categoryId));
  assert.equal(ids.size, 5, "each link must target a distinct category");
  for (const id of ids) {
    assert.ok(EXPECTED_CATEGORY_SLUGS[id], `${id} needs an expected slug`);
  }
});

test("labels match the renamed category titles", () => {
  const labels = KEYS.map((key) => NAVIGATION_LINK_PLAN[key].label);
  assert.deepEqual(labels.sort(), [
    "Costs & Down Payments",
    "Getting Approved",
    "Loan Types",
    "Mortgage Rates & Market",
    "The Buying Process",
  ]);
  // No label may still read as a pre-rename bucket name.
  for (const label of labels) {
    assert.doesNotMatch(label, /Buyer Education|Personal Finances|Requirements|Benefits of Buying Now/);
  }
});

test("plans an update for every link from a clean document", () => {
  const plan = buildNavigationPlan(navigation(), categories());
  assert.equal(plan.fatal.length, 0);
  assert.equal(plan.updates.length, 5);
  for (const update of plan.updates) {
    assert.equal(update.label, NAVIGATION_LINK_PLAN[update.key].label);
    assert.equal(update.fromExternal, null);
  }
});

test("converts the external legacy link and records where it came from", () => {
  const links = KEYS.map((key) =>
    key === "benefits-of-buying-now"
      ? link(key, {
          destination: {
            _type: "navigationDestination",
            kind: "external",
            external: "/benefits-of-buying-now/",
            openInNewTab: false,
          },
        })
      : link(key),
  );
  const plan = buildNavigationPlan(navigation(links), categories());
  assert.equal(plan.fatal.length, 0);
  const converted = plan.updates.find((u) => u.key === "benefits-of-buying-now");
  assert.equal(converted.fromExternal, "/benefits-of-buying-now/");
  assert.equal(
    converted.categoryId,
    NAVIGATION_LINK_PLAN["benefits-of-buying-now"].categoryId,
  );

  const report = buildDryRunReport(plan);
  assert.equal(report.summary.externalConverted, 1);
  assert.equal(
    report.updates.find((u) => u.key === "benefits-of-buying-now").target,
    "/blog/category/buying-process/",
  );
});

test("is idempotent — re-running against migrated links still plans cleanly", () => {
  const links = KEYS.map((key) =>
    link(key, {
      label: NAVIGATION_LINK_PLAN[key].label,
      description: NAVIGATION_LINK_PLAN[key].description,
    }),
  );
  const plan = buildNavigationPlan(navigation(links), categories());
  assert.equal(plan.fatal.length, 0);
  assert.equal(plan.updates.length, 5);
});

test("aborts when a target category carries an unexpected slug", () => {
  const id = NAVIGATION_LINK_PLAN["buyer-education"].categoryId;
  const plan = buildNavigationPlan(
    navigation(),
    categories({ [id]: "buyer-education" }),
  );
  assert.match(
    plan.fatal.find((f) => f.id === id).reason,
    /expected slug "getting-approved", found "buyer-education"/,
  );
});

test("aborts when a target category is missing", () => {
  const id = NAVIGATION_LINK_PLAN["requirements"].categoryId;
  const plan = buildNavigationPlan(
    navigation(),
    categories().filter((c) => c._id !== id),
  );
  assert.match(plan.fatal.find((f) => f.id === id).reason, /not found/);
});

test("aborts when an internal link points at the wrong category", () => {
  const links = KEYS.map((key) =>
    key === "requirements"
      ? link(key, {
          destination: {
            _type: "navigationDestination",
            kind: "internal",
            internal: { _type: "reference", _ref: "some-other-id" },
          },
        })
      : link(key),
  );
  const plan = buildNavigationPlan(navigation(links), categories());
  assert.match(
    plan.fatal.find((f) => f.id === "requirements").reason,
    /internal ref is "some-other-id"/,
  );
});

test("aborts on an unplanned link in the blog group", () => {
  const links = [
    ...KEYS.map((key) => link(key)),
    { _key: "surprise", _type: "navigationChildLink", destination: {} },
  ];
  const plan = buildNavigationPlan(navigation(links), categories());
  assert.match(
    plan.fatal.find((f) => f.id === "surprise").reason,
    /not in the plan/,
  );
});

test("aborts when a planned link is missing from the group", () => {
  const links = KEYS.filter((key) => key !== "personal-finances").map((key) =>
    link(key),
  );
  const plan = buildNavigationPlan(navigation(links), categories());
  assert.match(
    plan.fatal.find((f) => f.id === "personal-finances").reason,
    /missing from the group/,
  );
});

test("aborts when the navigation document or blog group is absent", () => {
  assert.match(
    buildNavigationPlan(null, categories()).fatal[0].reason,
    /not found/,
  );

  const noGroup = buildNavigationPlan(
    { _id: "navigation", _rev: "r", items: [{ _key: "about-us", links: [] }] },
    categories(),
  );
  assert.match(
    noGroup.fatal.find((f) => f.id === "blog").reason,
    /blog navigation group not found/,
  );
});

test("dry-run report states the mode and resolves each target path", () => {
  const plan = buildNavigationPlan(navigation(), categories());
  const report = buildDryRunReport(plan);
  assert.equal(report.mode, "dry-run");
  assert.equal(report.summary.updates, 5);
  assert.equal(report.summary.fatal, 0);
  for (const update of report.updates) {
    assert.match(update.target, /^\/blog\/category\/[a-z-]+\/$/);
  }
  assert.equal(buildDryRunReport(plan, true).mode, "apply");
});
