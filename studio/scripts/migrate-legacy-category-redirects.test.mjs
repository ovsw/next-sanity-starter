import assert from "node:assert/strict";
import test from "node:test";

import { autoRedirectId } from "../functions/auto-redirect/model.ts";
import {
  LEGACY_CATEGORY_REDIRECTS,
  assertTargetDataset,
  buildDryRunReport,
  buildMigrationPlan,
  planTopologyError,
} from "./migrate-legacy-category-redirects.ts";

const CATEGORY_SLUGS = [
  "loan-types",
  "getting-approved",
  "closing-costs",
  "mortgage-rates",
];

function inventory(overrides = {}) {
  return {
    categorySlugs: CATEGORY_SLUGS,
    redirects: [],
    routedDocuments: CATEGORY_SLUGS.map((slug) => ({
      _id: `category-${slug}`,
      _type: "category",
      slug: { _type: "slug", current: slug },
    })),
    ...overrides,
  };
}

function expectedDocuments() {
  return buildMigrationPlan(inventory()).records.map(({ document }) => document);
}

test("plans five creates at deterministic ids", () => {
  const plan = buildMigrationPlan(inventory());
  assert.deepEqual(plan.summary, { create: 5, noOp: 0, fatal: 0 });

  for (const record of plan.records) {
    assert.equal(record.status, "create");
    assert.equal(
      record.document._id,
      autoRedirectId(record.document.source.current),
    );
    assert.equal(record.document.status, "active");
    assert.equal(record.document.permanent, "true");
  }
});

test("re-running against the migrated dataset is all no-ops", () => {
  const plan = buildMigrationPlan(inventory({ redirects: expectedDocuments() }));
  assert.deepEqual(plan.summary, { create: 0, noOp: 5, fatal: 0 });
  assert.equal(plan.creates.length, 0);
});

test("fatal when a destination category slug is missing", () => {
  const plan = buildMigrationPlan(
    inventory({
      categorySlugs: CATEGORY_SLUGS.filter((slug) => slug !== "loan-types"),
    }),
  );
  assert.ok(
    plan.fatal.some(({ reason }) =>
      reason.includes("no published category with slug loan-types"),
    ),
  );
});

test("the /blog/ destination needs no category", () => {
  const plan = buildMigrationPlan(inventory());
  const blogRecord = plan.records.find(
    ({ document }) => document.destination.current === "/blog/",
  );
  assert.equal(blogRecord.status, "create");
});

test("fatal when a live route owns a legacy source", () => {
  const plan = buildMigrationPlan(
    inventory({
      routedDocuments: [
        ...inventory().routedDocuments,
        {
          _id: "page-1",
          _type: "page",
          slug: { _type: "slug", current: "types-of-loans" },
        },
      ],
    }),
  );
  assert.equal(plan.records[0].status, "fatal");
  assert.match(plan.records[0].reason, /live route/);
});

test("fatal when another redirect owns a legacy source", () => {
  const [expected] = expectedDocuments();
  const plan = buildMigrationPlan(
    inventory({
      redirects: [{ ...expected, _id: "hand-authored" }],
    }),
  );
  assert.equal(plan.records[0].status, "fatal");
  assert.match(plan.records[0].reason, /already owned by redirect/);
});

test("fatal when the document at the deterministic id differs", () => {
  const [expected] = expectedDocuments();
  const plan = buildMigrationPlan(
    inventory({
      redirects: [
        { ...expected, destination: { _type: "slug", current: "/different/" } },
      ],
    }),
  );
  assert.equal(plan.records[0].status, "fatal");
  assert.match(plan.records[0].reason, /differs from the expected redirect/);
});

test("reports dry-run mode and enforces the sole target dataset", () => {
  const report = buildDryRunReport(buildMigrationPlan(inventory()));
  assert.equal(report.projectId, "hv0545v9");
  assert.equal(report.dataset, "development");
  assert.equal(report.mode, "dry-run");
  assert.equal(LEGACY_CATEGORY_REDIRECTS.length, 5);

  assert.doesNotThrow(() =>
    assertTargetDataset({ projectId: "hv0545v9", dataset: "development" }),
  );
  assert.throws(
    () => assertTargetDataset({ projectId: "other", dataset: "development" }),
    /Refusing to run outside hv0545v9\/development/,
  );
  assert.throws(
    () => assertTargetDataset({ projectId: "hv0545v9", dataset: "other" }),
    /Refusing to run outside hv0545v9\/development/,
  );
});

test("accepts a topology with no chains", () => {
  const plan = buildMigrationPlan(inventory());
  const error = planTopologyError(
    inventory(),
    plan.records.map((record) => record.document),
  );
  assert.equal(error, undefined);
});

test("rejects a chain formed with an existing redirect", () => {
  // An existing redirect INTO a legacy source turns the planned redirect into
  // the second hop of a chain, which compileNextRedirects rejects at build time.
  const existing = {
    _id: "redirect-existing",
    _type: "redirect",
    status: "active",
    permanent: "true",
    source: { _type: "slug", current: "/old-archive/" },
    destination: { _type: "slug", current: "/types-of-loans/" },
  };
  const withExisting = inventory({ redirects: [existing] });
  const plan = buildMigrationPlan(withExisting);
  const error = planTopologyError(
    withExisting,
    plan.records.map((record) => record.document),
  );
  assert.ok(error, "a chain must be reported");
  assert.match(error, /chain|cycle/i);
});

test("does not double-count a planned redirect that already exists", () => {
  // A re-run classifies the five as no-op; counting them as both existing and
  // planned would look like a conflicting source and abort a valid re-run.
  const plan = buildMigrationPlan(inventory());
  const planned = plan.records.map((record) => record.document);
  const migrated = inventory({ redirects: planned });
  assert.equal(planTopologyError(migrated, planned), undefined);
});

test("keeps the two topical destinations that diverge from document identity", () => {
  // These look wrong against CATEGORY_PLAN and are deliberate: redirects follow
  // what the legacy URL was ABOUT, not which CMS document was reused for the
  // rename. Pinned so a future "consistency" cleanup has to argue with a test.
  const bySource = Object.fromEntries(
    LEGACY_CATEGORY_REDIRECTS.map(({ source, destination }) => [
      source,
      destination,
    ]),
  );

  // The benefits-of-buying-now document became `buying-process`, but the legacy
  // page was market-timing content.
  assert.equal(
    bySource["/benefits-of-buying-now/"],
    "/blog/category/mortgage-rates/",
  );

  // The requirements document became `mortgage-rates`, but "requirements" means
  // approval criteria.
  assert.equal(
    bySource["/requirements/"],
    "/blog/category/getting-approved/",
  );

  // The catch-all archive goes to the blog index, not any single category.
  assert.equal(bySource["/buyer-education/"], "/blog/");
});
