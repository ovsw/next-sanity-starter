import process from "node:process";
import { pathToFileURL } from "node:url";
import type { Patch } from "@sanity/client";
import { getCliClient } from "sanity/cli";

const API_VERSION = "2026-08-11";
const PROJECT_ID = "hv0545v9";
const DATASET = "development";

/**
 * Re-cut the six blog categories along buyer-journey lines and reassign every
 * post. Categories are renamed in place so their ids stay stable and the 58
 * post references remain valid; only reassigned posts are patched.
 *
 * Which existing document becomes which new category is chosen to minimise
 * reassignment, not to preserve semantic lineage — the 44-post Buyer Education
 * document becomes Getting Approved so 35 posts move rather than 44.
 *
 * Descriptions are written here rather than typed into the Studio: editing them
 * by hand would create category drafts, which this script's own preflight
 * rejects. Indexability needs all three of publishedPostCount > 0, a
 * description, and meta.noindex !== true (see isIndexableCategory in
 * frontend/lib/blog-index.ts), so writing descriptions is what makes the
 * archives eligible for the sitemap.
 */
export const CATEGORY_PLAN = {
  "9c4c1393-afe8-4eb4-b662-a20789de0c1b": {
    fromSlug: "buyer-education",
    title: "Getting Approved",
    slug: "getting-approved",
    description:
      "Everything between deciding to buy and holding an approval letter: pre-qualification versus pre-approval, the documents lenders ask for, how credit is evaluated, and what makes an application strong. Start here if you want to know where you stand before you shop.",
  },
  "9e74332a-7a4e-4322-bd00-91dd80c29e94": {
    fromSlug: "loan-types",
    title: "Loan Types",
    slug: "loan-types",
    description:
      "Conventional, FHA, VA, USDA, jumbo, renovation, reverse, and assumable loans compared in plain terms — who each one fits, what it requires, and where it costs more. Arizona programs like Home Plus are covered alongside the national options.",
  },
  "ec3cbe04-4630-4c73-bc41-f73523b2de97": {
    fromSlug: "personal-finances",
    title: "Costs & Down Payments",
    slug: "closing-costs",
    description:
      "What buying actually costs beyond the sticker price: closing costs, earnest money, the fees that surprise people, and how much you genuinely need up front. Includes down payment assistance available to Arizona buyers and honest math on affordability.",
  },
  "5fd54e84-404e-459f-bc8f-6ea5435149f9": {
    fromSlug: "mortgage-requirements",
    title: "Mortgage Rates & Market",
    slug: "mortgage-rates",
    description:
      "Why mortgage rates move and what that means for a Phoenix buyer — inflation, bond markets, and the local price pressures behind Maricopa County listings. Also covers points, buydowns, and whether paying to lower your rate is worth it.",
  },
  "a8649d6b-6478-4c41-8294-e3b947539946": {
    fromSlug: "benefits-of-buying-now",
    title: "The Buying Process",
    slug: "buying-process",
    description:
      "The purchase from offer to keys: how the steps sequence, how long an Arizona appraisal takes, what to ask on a showing, and how seller concessions work. Written for people already under contract or close to it.",
  },
  "66619325-b9e7-4b38-8120-dfbf16e9af7c": {
    fromSlug: "realtor-information",
    title: "Owning & Refinancing",
    slug: "refinance",
    description:
      "For people who already own: when refinancing is worth the closing costs, how to tap equity without overleveraging, what forbearance does to your options, and financing a second or vacation property.",
  },
} as const;

/**
 * Post slug -> destination category slug. Keyed on slug, never title: 26 of the
 * 58 stored titles differ from their reviewed form (curly quotes, trailing
 * spaces, em-dashes) and one post's title bears no resemblance to its slug
 * (`mortgage-loan` is "The Difference Between Pre-Qualification and
 * Pre-Approval on a Mortgage Loan"). Title matching would silently drop rows.
 */
export const POST_PLAN: Record<string, string> = {
  // Mortgage Rates & Market (12)
  "current-refinance-and-mortgage-rates": "mortgage-rates",
  "factors-that-affect-phoenix-interest-rates": "mortgage-rates",
  "mortgage-interest-rates": "mortgage-rates",
  "mortgage-points": "mortgage-rates",
  "obtain-lowest-mortgage-interest-rate": "mortgage-rates",
  "rent-vs-buy-investing-vs-homeownership": "mortgage-rates",
  "what-is-an-extreme-buydown": "mortgage-rates",
  "what-is-loan-discount-fee": "mortgage-rates",
  "where-americans-are-moving": "mortgage-rates",
  "why-home-prices-fluctuate": "mortgage-rates",
  "why-mortgage-rates-are-rising-oil-prices-inflation": "mortgage-rates",
  "why-now-is-the-best-window-for-buyers": "mortgage-rates",

  // Getting Approved (10)
  "home-loans-becoming-harder-to-get": "getting-approved",
  "how-long-is-a-mortgage-pre-approval-good-for": "getting-approved",
  "how-to-apply-for-a-mortgage": "getting-approved",
  "how-to-be-an-ideal-borrower-for-a-mortgage-lender": "getting-approved",
  "how-to-get-preapproved-for-a-mortgage": "getting-approved",
  "how-to-use-rent-reporting-to-build-credit": "getting-approved",
  "mortgage-documentation-requirements": "getting-approved",
  "mortgage-loan": "getting-approved",
  "mortgage-process-dos-and-donts": "getting-approved",
  "pre-qualified-vs-pre-approved": "getting-approved",

  // Loan Types (13)
  "are-va-loan-appraisals-tougher": "loan-types",
  "benefits-home-plus-mortgage-loan-program": "loan-types",
  "conventional-financing-for-your-home-purchase": "loan-types",
  "conventional-loan-fha-pros-cons": "loan-types",
  "first-time-home-buyer-learn-how-jumbo-loans-work": "loan-types",
  "how-does-a-balloon-mortgage-work": "loan-types",
  "how-to-choose-type-mortgage-loan": "loan-types",
  "renovation-loan": "loan-types",
  "scottsdale-jumbo-loan": "loan-types",
  "the-benefits-of-an-assumable-mortgage": "loan-types",
  "usda-loan-information": "loan-types",
  "what-are-the-3-main-types-of-home-loans": "loan-types",
  "what-is-a-reverse-mortgage": "loan-types",

  // The Buying Process (10)
  "buying-a-new-home-questions-to-ask": "buying-process",
  "home-appraisal-timeline-arizona": "buying-process",
  "local-vs-out-of-state-lender-does-it-really-matter": "buying-process",
  "mortgage-process": "buying-process",
  "phoenix-home-loans-easy-process": "buying-process",
  "phoenix-loan-officer": "buying-process",
  "questions-buyers-should-ask-during-a-house-tour": "buying-process",
  "questions-to-ask-before-buying-a-new-home": "buying-process",
  "seller-concessions-buying-home": "buying-process",
  "touring-etiquette-home-buyers": "buying-process",

  // Costs & Down Payments (9)
  "5-financial-benefits-of-buying-vs-renting": "closing-costs",
  "buy-house-low-no-down-payment": "closing-costs",
  "down-payment-assistance-available-when-buying-home": "closing-costs",
  "hidden-costs-when-buying-a-house": "closing-costs",
  "how-much-are-closing-costs-on-a-house": "closing-costs",
  "how-much-mortgage-can-i-afford": "closing-costs",
  "how-to-come-up-with-a-down-payment": "closing-costs",
  "mortgage-amortization-calculator": "closing-costs",
  "what-is-earnest-money": "closing-costs",

  // Owning & Refinancing (4)
  "mortgage-forbearance": "refinance",
  "signs-you-should-refinance-your-mortgage": "refinance",
  "using-your-equity-to-increase-your-homes-value": "refinance",
  "vacation-home-mortgage-requirements": "refinance",
};

/** Counted from POST_PLAN, asserted against the dataset after apply. */
export const EXPECTED_DISTRIBUTION: Record<string, number> = {
  "loan-types": 13,
  "mortgage-rates": 12,
  "getting-approved": 10,
  "buying-process": 10,
  "closing-costs": 9,
  refinance: 4,
};

export type CategoryDocument = {
  _id: string;
  _rev: string;
  meta?: { noindex?: unknown } | null;
  slug?: { current?: unknown } | null;
};

export type PostDocument = {
  _id: string;
  _rev: string;
  category?: unknown;
  slug?: { current?: unknown } | null;
};

export type MigrationInventory = {
  categories: CategoryDocument[];
  drafts: { _id: string; _type: string }[];
  posts: PostDocument[];
};

type Fatal = { id: string; reason: string };

export type MigrationPlan = {
  categories: {
    description: string;
    id: string;
    rev: string;
    slug: string;
    title: string;
  }[];
  fatal: Fatal[];
  posts: { id: string; ref: string; rev: string; slug: string }[];
};

function readSlug(value: CategoryDocument | PostDocument) {
  const slug = value.slug?.current;
  return typeof slug === "string" ? slug : undefined;
}

function readCategoryRef(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  const ref = (value as { _ref?: unknown })._ref;
  return typeof ref === "string" ? ref : undefined;
}

/**
 * Build the full mutation plan, collecting every problem rather than throwing on
 * the first. The caller aborts before writing if `fatal` is non-empty, so a bad
 * dataset produces one complete report instead of a game of whack-a-mole.
 */
export function buildMigrationPlan(
  inventory: MigrationInventory,
): MigrationPlan {
  const fatal: Fatal[] = [];

  // Any draft of a category or a mapped post could republish stale data over the
  // migration later. Abort rather than patching both versions: this is a
  // one-time script and a no-editor project, so drafts are transient.
  for (const draft of inventory.drafts) {
    fatal.push({
      id: draft._id,
      reason: `${draft._type} draft exists — publish or discard it, then re-run`,
    });
  }

  const slugToId = new Map<string, string>();
  for (const [id, plan] of Object.entries(CATEGORY_PLAN)) {
    slugToId.set(plan.slug, id);
  }

  const categories: MigrationPlan["categories"] = [];
  const seenCategoryIds = new Set<string>();

  for (const category of inventory.categories) {
    seenCategoryIds.add(category._id);
    const plan = CATEGORY_PLAN[category._id as keyof typeof CATEGORY_PLAN];
    if (!plan) {
      fatal.push({
        id: category._id,
        reason: "unmapped category — the taxonomy expects exactly six",
      });
      continue;
    }
    const current = readSlug(category);
    // Tolerate the already-migrated slug so re-runs are idempotent, but reject
    // anything else: a third value means the dataset drifted from this plan.
    if (current !== plan.fromSlug && current !== plan.slug) {
      fatal.push({
        id: category._id,
        reason: `expected slug "${plan.fromSlug}" or "${plan.slug}", found "${String(current)}"`,
      });
      continue;
    }
    // meta.noindex would keep the archive out of the sitemap even with a
    // description. Abort rather than clearing it — an editor may have set it
    // deliberately, and overriding an explicit SEO decision is not this
    // script's call.
    if (category.meta?.noindex === true) {
      fatal.push({
        id: category._id,
        reason: "meta.noindex is true — clear it in the Studio, then re-run",
      });
      continue;
    }
    categories.push({
      description: plan.description,
      id: category._id,
      rev: category._rev,
      slug: plan.slug,
      title: plan.title,
    });
  }

  for (const id of Object.keys(CATEGORY_PLAN)) {
    if (!seenCategoryIds.has(id)) {
      fatal.push({ id, reason: "mapped category missing from the dataset" });
    }
  }

  const posts: MigrationPlan["posts"] = [];
  const mappedSlugs = new Set<string>();

  for (const post of inventory.posts) {
    const slug = readSlug(post);
    if (!slug) {
      fatal.push({ id: post._id, reason: "post has no slug" });
      continue;
    }
    const target = POST_PLAN[slug];
    if (!target) {
      fatal.push({ id: post._id, reason: `post slug "${slug}" is unmapped` });
      continue;
    }
    mappedSlugs.add(slug);
    const ref = slugToId.get(target);
    if (!ref) {
      fatal.push({
        id: post._id,
        reason: `destination "${target}" is not a planned category slug`,
      });
      continue;
    }
    posts.push({ id: post._id, ref, rev: post._rev, slug });
  }

  // Parity in the other direction: a mapping key matching nothing means the plan
  // and the dataset disagree, which would silently under-migrate.
  for (const slug of Object.keys(POST_PLAN)) {
    if (!mappedSlugs.has(slug)) {
      fatal.push({
        id: slug,
        reason: "mapping key matches no post in the dataset",
      });
    }
  }

  return { categories, fatal, posts };
}

export function buildDistribution(plan: MigrationPlan) {
  const idToSlug = new Map(
    Object.entries(CATEGORY_PLAN).map(([id, entry]) => [id, entry.slug]),
  );
  const counts: Record<string, number> = {};
  for (const slug of Object.values(CATEGORY_PLAN).map((e) => e.slug)) {
    counts[slug] = 0;
  }
  for (const post of plan.posts) {
    const slug = idToSlug.get(post.ref);
    if (slug) counts[slug] = (counts[slug] ?? 0) + 1;
  }
  return counts;
}

export function buildDryRunReport(plan: MigrationPlan, apply = false) {
  return {
    projectId: PROJECT_ID,
    dataset: DATASET,
    mode: apply ? "apply" : "dry-run",
    summary: {
      categories: plan.categories.length,
      posts: plan.posts.length,
      fatal: plan.fatal.length,
    },
    distribution: buildDistribution(plan),
    expectedDistribution: EXPECTED_DISTRIBUTION,
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

  const [categories, posts, drafts] = await Promise.all([
    client.fetch<CategoryDocument[]>(
      `*[_type == "category" && !(_id in path("drafts.**"))] | order(_id asc){_id, _rev, slug, meta}`,
    ),
    client.fetch<PostDocument[]>(
      `*[_type == "post" && !(_id in path("drafts.**"))] | order(_id asc){_id, _rev, slug, category}`,
    ),
    client.fetch<{ _id: string; _type: string }[]>(
      `*[_type in ["category", "post"] && _id in path("drafts.**")] | order(_id asc){_id, _type}`,
    ),
  ]);

  const plan = buildMigrationPlan({ categories, drafts, posts });
  console.log(JSON.stringify(buildDryRunReport(plan, apply), null, 2));

  if (plan.fatal.length > 0) {
    throw new Error(
      `Aborting before any write: ${plan.fatal.length} fatal problem(s)`,
    );
  }

  const distribution = buildDistribution(plan);
  for (const [slug, expected] of Object.entries(EXPECTED_DISTRIBUTION)) {
    if (distribution[slug] !== expected) {
      throw new Error(
        `Aborting: ${slug} would receive ${distribution[slug]} posts, expected ${expected}`,
      );
    }
  }

  if (!apply) {
    console.log("Dry run only. Re-run with --apply to write.");
    return;
  }

  // One transaction: category renames + descriptions and every post
  // reassignment, so the dataset is never half-migrated. Every patch carries an
  // ifRevisionId guard, so a concurrent edit fails the whole thing.
  const transaction = client.transaction();
  for (const category of plan.categories) {
    transaction.patch(category.id, (patch: Patch) =>
      patch.ifRevisionId(category.rev).set({
        title: category.title,
        slug: { _type: "slug", current: category.slug },
        description: category.description,
      }),
    );
  }
  for (const post of plan.posts) {
    transaction.patch(post.id, (patch: Patch) =>
      patch.ifRevisionId(post.rev).set({
        category: { _type: "reference", _ref: post.ref },
      }),
    );
  }
  await transaction.commit({ visibility: "sync" });

  const [categoriesAfter, postsAfter] = await Promise.all([
    client.fetch<CategoryDocument[]>(
      `*[_type == "category" && !(_id in path("drafts.**"))] | order(_id asc){_id, _rev, slug, "description": description}`,
    ),
    client.fetch<PostDocument[]>(
      `*[_type == "post" && !(_id in path("drafts.**"))] | order(_id asc){_id, _rev, slug, category}`,
    ),
  ]);

  const expectedSlugs = new Map(
    plan.categories.map((category) => [category.id, category.slug]),
  );
  for (const category of categoriesAfter) {
    const expected = expectedSlugs.get(category._id);
    if (!expected) {
      throw new Error(`Parity audit failed: unexpected category ${category._id}`);
    }
    if (readSlug(category) !== expected) {
      throw new Error(`Parity audit failed: ${category._id} slug mismatch`);
    }
    const description = (category as { description?: unknown }).description;
    if (typeof description !== "string" || description.trim() === "") {
      throw new Error(
        `Parity audit failed: ${category._id} has no description — the archive would stay noindex`,
      );
    }
  }

  const expectedRefs = new Map(plan.posts.map((post) => [post.id, post.ref]));
  if (postsAfter.length !== plan.posts.length) {
    throw new Error("Parity audit failed: post count changed");
  }
  for (const post of postsAfter) {
    if (readCategoryRef(post.category) !== expectedRefs.get(post._id)) {
      throw new Error(`Parity audit failed: ${post._id} category mismatch`);
    }
  }

  const actualDistribution: Record<string, number> = {};
  const idToSlug = new Map(
    Object.entries(CATEGORY_PLAN).map(([id, entry]) => [id, entry.slug]),
  );
  for (const post of postsAfter) {
    const slug = idToSlug.get(readCategoryRef(post.category) ?? "");
    if (slug) actualDistribution[slug] = (actualDistribution[slug] ?? 0) + 1;
  }
  for (const [slug, expected] of Object.entries(EXPECTED_DISTRIBUTION)) {
    if (actualDistribution[slug] !== expected) {
      throw new Error(
        `Parity audit failed: ${slug} has ${actualDistribution[slug]} posts, expected ${expected}`,
      );
    }
  }

  console.log(
    JSON.stringify(
      {
        applied: true,
        categories: categoriesAfter.length,
        posts: postsAfter.length,
        distribution: actualDistribution,
        descriptionsWritten: true,
        slugParity: true,
        categoryReferenceParity: true,
      },
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
