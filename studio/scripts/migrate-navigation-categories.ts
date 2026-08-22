import process from "node:process";
import { pathToFileURL } from "node:url";
import type { Patch } from "@sanity/client";
import { getCliClient } from "sanity/cli";

import { CATEGORY_PLAN } from "./migrate-category-taxonomy.ts";

const API_VERSION = "2026-08-11";
const PROJECT_ID = "hv0545v9";
const DATASET = "development";

const NAVIGATION_ID = "navigation";
const BLOG_GROUP_KEY = "blog";

/**
 * Point the Blog nav submenu at the re-cut categories.
 *
 * Two separate problems, both left behind by the taxonomy rename:
 *
 * 1. `benefits-of-buying-now` is an external link to `/benefits-of-buying-now/`,
 *    a legacy root URL that now only resolves via a 301. Internal navigation
 *    should never spend a redirect hop, so it becomes a reference like its four
 *    siblings — which then resolves through the shared internal-href resolver
 *    and follows any future rename automatically.
 *
 * 2. All five labels are the pre-rename category names. Labels are stored on the
 *    nav link rather than projected from the category (see navigation.ts), so
 *    the rename could not update them and the menu still reads "Buyer Education"
 *    while the archive it opens reads "Getting Approved".
 *
 * Descriptions are refreshed alongside the labels for the same reason: they
 * described the old buckets.
 */
export const NAVIGATION_LINK_PLAN = {
  "blog-types-of-loans": {
    categoryId: "9e74332a-7a4e-4322-bd00-91dd80c29e94",
    description: "Compare mortgage loan types and who each one fits.",
    label: "Loan Types",
  },
  "personal-finances": {
    categoryId: "ec3cbe04-4630-4c73-bc41-f73523b2de97",
    description: "Closing costs, earnest money, and down payment help.",
    label: "Costs & Down Payments",
  },
  requirements: {
    categoryId: "5fd54e84-404e-459f-bc8f-6ea5435149f9",
    description: "Why rates move and what it means for Phoenix buyers.",
    label: "Mortgage Rates & Market",
  },
  "benefits-of-buying-now": {
    categoryId: "a8649d6b-6478-4c41-8294-e3b947539946",
    description: "The purchase step by step, from offer to keys.",
    label: "The Buying Process",
  },
  "buyer-education": {
    categoryId: "9c4c1393-afe8-4eb4-b662-a20789de0c1b",
    description: "Pre-approval, documents, and getting lender-ready.",
    label: "Getting Approved",
  },
} as const;

/**
 * Category id -> expected slug, asserted so a wrong rename aborts the run.
 * Derived from CATEGORY_PLAN rather than redeclared: a second hand-maintained
 * copy of the same table is exactly how the three migration scripts drifted
 * apart in the first place. Only the five categories the nav links to are
 * included; `realtor-information`/`refinance` has no submenu entry.
 */
export const EXPECTED_CATEGORY_SLUGS: Record<string, string> = Object.fromEntries(
  Object.values(NAVIGATION_LINK_PLAN).map((link) => [
    link.categoryId,
    CATEGORY_PLAN[link.categoryId as keyof typeof CATEGORY_PLAN].slug,
  ]),
);

export type NavigationLink = {
  _key: string;
  description?: unknown;
  destination?: {
    external?: unknown;
    internal?: { _ref?: unknown } | null;
    kind?: unknown;
    openInNewTab?: unknown;
  } | null;
  label?: unknown;
};

export type NavigationGroup = {
  _key: string;
  _type?: string;
  links?: NavigationLink[] | null;
};

export type NavigationDocument = {
  _id: string;
  _rev: string;
  items?: NavigationGroup[] | null;
};

export type CategoryDocument = {
  _id: string;
  slug?: { current?: unknown } | null;
};

type Fatal = { id: string; reason: string };

export type NavigationPlan = {
  fatal: Fatal[];
  updates: {
    fromExternal: string | null;
    index: number;
    key: string;
    label: string;
    description: string;
    categoryId: string;
  }[];
};

export function buildNavigationPlan(
  navigation: NavigationDocument | null,
  categories: CategoryDocument[],
): NavigationPlan {
  const fatal: Fatal[] = [];
  const updates: NavigationPlan["updates"] = [];

  if (!navigation) {
    return {
      fatal: [{ id: NAVIGATION_ID, reason: "navigation document not found" }],
      updates,
    };
  }

  // Every destination must exist and carry the slug this plan expects. A
  // mismatch means the taxonomy drifted from this script, and pointing the menu
  // at it would silently produce a wrong or dead link.
  const bySlug = new Map<string, string>();
  for (const category of categories) {
    const slug = category.slug?.current;
    if (typeof slug === "string") bySlug.set(category._id, slug);
  }
  for (const [id, expected] of Object.entries(EXPECTED_CATEGORY_SLUGS)) {
    const actual = bySlug.get(id);
    if (actual === undefined) {
      fatal.push({ id, reason: "target category not found" });
    } else if (actual !== expected) {
      fatal.push({
        id,
        reason: `expected slug "${expected}", found "${actual}"`,
      });
    }
  }

  const group = (navigation.items ?? []).find(
    (item) => item._key === BLOG_GROUP_KEY,
  );
  if (!group) {
    fatal.push({
      id: BLOG_GROUP_KEY,
      reason: "blog navigation group not found",
    });
    return { fatal, updates };
  }

  const links = group.links ?? [];
  const seen = new Set<string>();

  links.forEach((link, index) => {
    const plan =
      NAVIGATION_LINK_PLAN[link._key as keyof typeof NAVIGATION_LINK_PLAN];
    if (!plan) {
      fatal.push({
        id: link._key,
        reason: "blog nav link is not in the plan — taxonomy drifted",
      });
      return;
    }
    seen.add(link._key);
    const destination = link.destination ?? {};
    const currentRef = destination.internal?._ref;
    const isExternal = destination.kind === "external";
    // Tolerate an already-migrated link so re-runs are idempotent; reject a
    // reference pointing somewhere unexpected.
    if (!isExternal && currentRef !== plan.categoryId) {
      fatal.push({
        id: link._key,
        reason: `internal ref is "${String(currentRef)}", expected "${plan.categoryId}"`,
      });
      return;
    }
    updates.push({
      categoryId: plan.categoryId,
      description: plan.description,
      fromExternal: isExternal ? String(destination.external ?? "") : null,
      index,
      key: link._key,
      label: plan.label,
    });
  });

  for (const key of Object.keys(NAVIGATION_LINK_PLAN)) {
    if (!seen.has(key)) {
      fatal.push({ id: key, reason: "planned nav link missing from the group" });
    }
  }

  return { fatal, updates };
}

export function buildDryRunReport(plan: NavigationPlan, apply = false) {
  return {
    projectId: PROJECT_ID,
    dataset: DATASET,
    mode: apply ? "apply" : "dry-run",
    summary: {
      updates: plan.updates.length,
      externalConverted: plan.updates.filter((u) => u.fromExternal).length,
      fatal: plan.fatal.length,
    },
    updates: plan.updates.map((update) => ({
      key: update.key,
      label: update.label,
      target: `/blog/category/${EXPECTED_CATEGORY_SLUGS[update.categoryId]}/`,
      wasExternal: update.fromExternal,
    })),
    fatal: plan.fatal,
  };
}

async function run() {
  const apply = process.argv.includes("--apply");
  const client = getCliClient({ apiVersion: API_VERSION });
  const { dataset, projectId } = client.config();

  if (projectId !== PROJECT_ID || dataset !== DATASET) {
    throw new Error(
      `Refusing to run against ${String(projectId)}/${String(dataset)} — expected ${PROJECT_ID}/${DATASET}`,
    );
  }

  const [navigation, categories, drafts] = await Promise.all([
    client.fetch<NavigationDocument | null>(
      `*[_id == $id][0]{_id, _rev, items}`,
      { id: NAVIGATION_ID },
    ),
    client.fetch<CategoryDocument[]>(
      `*[_type == "category" && !(_id in path("drafts.**"))]{_id, slug}`,
    ),
    client.fetch<{ _id: string }[]>(
      `*[_id == $draftId]{_id}`,
      { draftId: `drafts.${NAVIGATION_ID}` },
    ),
  ]);

  const plan = buildNavigationPlan(navigation, categories);
  if (drafts.length > 0) {
    plan.fatal.push({
      id: `drafts.${NAVIGATION_ID}`,
      reason: "navigation draft exists — publish or discard it, then re-run",
    });
  }

  console.log(JSON.stringify(buildDryRunReport(plan, apply), null, 2));

  if (plan.fatal.length > 0) {
    throw new Error(
      `Aborting before any write: ${plan.fatal.length} fatal problem(s)`,
    );
  }
  if (!apply) {
    console.log("Dry run only. Re-run with --apply to write.");
    return;
  }

  const groupIndex = (navigation?.items ?? []).findIndex(
    (item: NavigationGroup) => item._key === BLOG_GROUP_KEY,
  );

  // Patch by array index within the blog group, guarded on the document
  // revision so a concurrent Studio edit fails the whole transaction rather
  // than writing into a reordered array.
  const transaction = client.transaction();
  transaction.patch(NAVIGATION_ID, (patch: Patch) => {
    let next = patch.ifRevisionId(navigation!._rev);
    for (const update of plan.updates) {
      const base = `items[${groupIndex}].links[${update.index}]`;
      next = next.set({
        [`${base}.label`]: update.label,
        [`${base}.description`]: update.description,
        [`${base}.destination.kind`]: "internal",
        [`${base}.destination.internal`]: {
          _type: "reference",
          _ref: update.categoryId,
        },
      });
      if (update.fromExternal) {
        next = next.unset([`${base}.destination.external`]);
      }
    }
    return next;
  });
  await transaction.commit({ visibility: "sync" });

  const after = await client.fetch<NavigationDocument | null>(
    `*[_id == $id][0]{_id, _rev, items}`,
    { id: NAVIGATION_ID },
  );
  const afterGroup = (after?.items ?? []).find(
    (item: NavigationGroup) => item._key === BLOG_GROUP_KEY,
  );
  const afterLinks = afterGroup?.links ?? [];

  for (const update of plan.updates) {
    const link = afterLinks.find(
      (candidate: NavigationLink) => candidate._key === update.key,
    );
    if (!link) {
      throw new Error(`Parity audit failed: ${update.key} disappeared`);
    }
    if (link.label !== update.label) {
      throw new Error(`Parity audit failed: ${update.key} label not updated`);
    }
    if (link.destination?.kind !== "internal") {
      throw new Error(`Parity audit failed: ${update.key} is not internal`);
    }
    if (link.destination?.internal?._ref !== update.categoryId) {
      throw new Error(`Parity audit failed: ${update.key} ref mismatch`);
    }
    if (link.destination?.external !== undefined) {
      throw new Error(
        `Parity audit failed: ${update.key} retains an external path`,
      );
    }
  }

  console.log(
    JSON.stringify(
      { applied: true, updated: plan.updates.length, externalRemaining: 0 },
      null,
      2,
    ),
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
