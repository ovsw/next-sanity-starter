import process from "node:process";
import { pathToFileURL } from "node:url";
import type { Patch } from "@sanity/client";
import { getCliClient } from "sanity/cli";

const API_VERSION = "2026-08-11";
const PROJECT_ID = "hv0545v9";
const DATASET = "development";

/**
 * The pre-rename slugs this migration normalised. Superseded by
 * migrate-category-taxonomy.ts, which renamed every one of these.
 *
 * This script is spent. It is kept for the record, but re-running it against a
 * migrated dataset would rewrite the taxonomy slugs back to these values,
 * silently reverting the rename and turning the five legacy category redirects
 * into 301s pointing at archives that no longer exist. TAXONOMY_SLUGS below is
 * the guard that stops it.
 */
export const CATEGORY_SLUGS = {
  "5fd54e84-404e-459f-bc8f-6ea5435149f9": "mortgage-requirements",
  "66619325-b9e7-4b38-8120-dfbf16e9af7c": "realtor-information",
  "9c4c1393-afe8-4eb4-b662-a20789de0c1b": "buyer-education",
  "9e74332a-7a4e-4322-bd00-91dd80c29e94": "loan-types",
  "a8649d6b-6478-4c41-8294-e3b947539946": "benefits-of-buying-now",
  "ec3cbe04-4630-4c73-bc41-f73523b2de97": "personal-finances",
} as const;

/**
 * Post-rename slugs, from migrate-category-taxonomy.ts. A category already
 * carrying one of these means the taxonomy migration has run and this script
 * must not touch it. `loan-types` is deliberately absent: it is unchanged by the
 * rename, so its presence proves nothing either way.
 */
export const TAXONOMY_SLUGS: Record<string, string> = {
  "5fd54e84-404e-459f-bc8f-6ea5435149f9": "mortgage-rates",
  "66619325-b9e7-4b38-8120-dfbf16e9af7c": "refinance",
  "9c4c1393-afe8-4eb4-b662-a20789de0c1b": "getting-approved",
  "a8649d6b-6478-4c41-8294-e3b947539946": "buying-process",
  "ec3cbe04-4630-4c73-bc41-f73523b2de97": "closing-costs",
};

type Reference = {
  _ref: string;
  _type: "reference";
};

export type PostDocument = {
  _id: string;
  _rev: string;
  _hasCategories?: boolean;
  _hasCategory?: boolean;
  categories?: unknown;
  category?: unknown;
};

export type CategoryDocument = {
  _id: string;
  _rev: string;
  slug?: { _type?: string; current?: unknown } | null;
};

type PostClassification = {
  id: string;
  status: "migratable" | "already-migrated" | "fatal";
  expectedCategoryRef?: string;
  reason?: string;
  mutation?: {
    id: string;
    ifRevisionId: string;
    set?: { category: Reference };
    unset: ["categories"];
  };
};

type CategoryClassification = {
  id: string;
  status: "migratable" | "already-migrated" | "fatal";
  expectedSlug?: string;
  reason?: string;
  mutation?: {
    id: string;
    ifRevisionId: string;
    set: { slug: { _type: "slug"; current: string } };
  };
};

type MigrationPlan = {
  posts: PostClassification[];
  categories: CategoryClassification[];
  postMutations: NonNullable<PostClassification["mutation"]>[];
  categoryMutations: NonNullable<CategoryClassification["mutation"]>[];
  fatal: Array<{ id: string; reason: string }>;
  summary: {
    posts: { migrated: number; skipped: number; fatal: number };
    categories: { migrated: number; skipped: number; fatal: number };
  };
};

function hasOwn(value: object, key: PropertyKey) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function readReference(value: unknown): Reference | undefined {
  if (!value || typeof value !== "object") return undefined;
  if (!("_type" in value) || value._type !== "reference") return undefined;
  if (!("_ref" in value) || typeof value._ref !== "string" || !value._ref) {
    return undefined;
  }
  return { _type: "reference", _ref: value._ref };
}

function referenceProblem(
  value: unknown,
  targetTypes: ReadonlyMap<string, string>,
  field: string,
) {
  const reference = readReference(value);
  if (!reference) return `${field} is not a valid reference`;
  const targetType = targetTypes.get(reference._ref);
  if (!targetType) return `${field} has a dangling reference: ${reference._ref}`;
  if (targetType !== "category") {
    return `${field} points at ${targetType}, not category: ${reference._ref}`;
  }
  return undefined;
}

export function classifyPost(
  post: PostDocument,
  targetTypes: ReadonlyMap<string, string>,
): PostClassification {
  const hasLegacy = post._hasCategories ?? hasOwn(post, "categories");
  const hasCategory = post._hasCategory ?? hasOwn(post, "category");
  let legacyReference: Reference | undefined;
  let categoryReference: Reference | undefined;

  if (hasLegacy) {
    if (!Array.isArray(post.categories)) {
      return { id: post._id, status: "fatal", reason: "categories is not an array" };
    }
    if (post.categories.length !== 1) {
      return {
        id: post._id,
        status: "fatal",
        reason: `categories has ${post.categories.length} references; expected exactly one`,
      };
    }
    const problem = referenceProblem(post.categories[0], targetTypes, "categories[0]");
    if (problem) return { id: post._id, status: "fatal", reason: problem };
    legacyReference = readReference(post.categories[0]);
  }

  if (hasCategory) {
    const problem = referenceProblem(post.category, targetTypes, "category");
    if (problem) return { id: post._id, status: "fatal", reason: problem };
    categoryReference = readReference(post.category);
  }

  if (!legacyReference && !categoryReference) {
    return { id: post._id, status: "fatal", reason: "no category reference" };
  }

  if (legacyReference && categoryReference) {
    if (legacyReference._ref !== categoryReference._ref) {
      return {
        id: post._id,
        status: "fatal",
        reason: `categories[0] (${legacyReference._ref}) conflicts with category (${categoryReference._ref})`,
      };
    }
    return {
      id: post._id,
      status: "already-migrated",
      expectedCategoryRef: categoryReference._ref,
      mutation: {
        id: post._id,
        ifRevisionId: post._rev,
        unset: ["categories"],
      },
    };
  }

  if (legacyReference) {
    return {
      id: post._id,
      status: "migratable",
      expectedCategoryRef: legacyReference._ref,
      mutation: {
        id: post._id,
        ifRevisionId: post._rev,
        set: { category: legacyReference },
        unset: ["categories"],
      },
    };
  }

  return {
    id: post._id,
    status: "already-migrated",
    expectedCategoryRef: categoryReference?._ref,
  };
}

function publishedId(id: string) {
  return id.replace(/^drafts\./, "");
}

function isValidCategorySlug(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) &&
    !/^\d+$/.test(value)
  );
}

function planCategories(categories: CategoryDocument[]) {
  const results: CategoryClassification[] = [];
  const versionsByPublishedId = new Map<string, CategoryDocument[]>();
  const currentSlugOwners = new Map<string, Set<string>>();

  for (const category of categories) {
    const id = publishedId(category._id);
    versionsByPublishedId.set(id, [...(versionsByPublishedId.get(id) || []), category]);
    const currentSlug = category.slug?.current;
    if (typeof currentSlug === "string") {
      currentSlugOwners.set(
        currentSlug,
        new Set([...(currentSlugOwners.get(currentSlug) || []), id]),
      );
    }
  }

  for (const id of Object.keys(CATEGORY_SLUGS)) {
    if (!versionsByPublishedId.has(id)) {
      results.push({
        id,
        status: "fatal",
        reason: "mapped category has no published or draft document",
      });
    }
  }

  // Ordering guard: if any category already carries a post-rename slug, the
  // taxonomy migration has run and this one is obsolete. Continuing would set
  // the slug back to its pre-rename value, reverting the rename and orphaning
  // the legacy category redirects that point at the new archives.
  for (const category of categories) {
    const id = publishedId(category._id);
    const taxonomySlug = TAXONOMY_SLUGS[id];
    if (taxonomySlug && category.slug?.current === taxonomySlug) {
      results.push({
        id: category._id,
        status: "fatal",
        reason: `category already migrated to "${taxonomySlug}" by migrate-category-taxonomy.ts — this script is superseded and would revert the rename`,
      });
    }
  }

  const expectedSlugByPublishedId = new Map<string, string>();
  for (const category of categories) {
    const id = publishedId(category._id);
    const mappedSlug = CATEGORY_SLUGS[id as keyof typeof CATEGORY_SLUGS];
    const existingSlug = category.slug?.current;
    const expectedSlug = mappedSlug || existingSlug;

    if (!isValidCategorySlug(expectedSlug)) {
      results.push({
        id: category._id,
        status: "fatal",
        reason: mappedSlug
          ? `mapped slug is invalid: ${mappedSlug}`
          : "unmapped category does not have a valid slug",
      });
      continue;
    }

    const currentOwners = currentSlugOwners.get(expectedSlug);
    if (mappedSlug && currentOwners && [...currentOwners].some((owner) => owner !== id)) {
      results.push({
        id: category._id,
        status: "fatal",
        reason: `proposed slug ${expectedSlug} is already used by ${[
          ...currentOwners,
        ].filter((owner) => owner !== id).join(", ")}`,
      });
      continue;
    }

    const owner = [...expectedSlugByPublishedId.entries()].find(
      ([otherId, slug]) => slug === expectedSlug && otherId !== id,
    );
    if (owner) {
      results.push({
        id: category._id,
        status: "fatal",
        reason: `slug ${expectedSlug} conflicts with category ${owner[0]}`,
      });
      continue;
    }
    expectedSlugByPublishedId.set(id, expectedSlug);

    if (existingSlug === expectedSlug && category.slug?._type === "slug") {
      results.push({
        id: category._id,
        status: "already-migrated",
        expectedSlug,
      });
      continue;
    }

    results.push({
      id: category._id,
      status: "migratable",
      expectedSlug,
      mutation: {
        id: category._id,
        ifRevisionId: category._rev,
        set: { slug: { _type: "slug", current: expectedSlug } },
      },
    });
  }

  return results;
}

export function buildMigrationPlan(
  posts: PostDocument[],
  categories: CategoryDocument[],
  targetTypes: ReadonlyMap<string, string>,
): MigrationPlan {
  const postResults = posts.map((post) => classifyPost(post, targetTypes));
  const categoryResults = planCategories(categories);
  const fatal = [...postResults, ...categoryResults]
    .filter(
      (result): result is typeof result & { reason: string } =>
        result.status === "fatal" && typeof result.reason === "string",
    )
    .map(({ id, reason }) => ({ id, reason }));

  return {
    posts: postResults,
    categories: categoryResults,
    postMutations: postResults.flatMap((result) =>
      result.mutation ? [result.mutation] : [],
    ),
    categoryMutations: categoryResults.flatMap((result) =>
      result.mutation ? [result.mutation] : [],
    ),
    fatal,
    summary: {
      posts: {
        migrated: postResults.filter((result) => result.status === "migratable").length,
        skipped: postResults.filter((result) => result.status === "already-migrated").length,
        fatal: postResults.filter((result) => result.status === "fatal").length,
      },
      categories: {
        migrated: categoryResults.filter((result) => result.status === "migratable").length,
        skipped: categoryResults.filter(
          (result) => result.status === "already-migrated",
        ).length,
        fatal: categoryResults.filter((result) => result.status === "fatal").length,
      },
    },
  };
}

export function buildDryRunReport(plan: MigrationPlan, apply = false) {
  return {
    projectId: PROJECT_ID,
    dataset: DATASET,
    mode: apply ? "apply" : "dry-run",
    summary: plan.summary,
    fatal: plan.fatal,
    mutations: {
      posts: plan.postMutations,
      categories: plan.categoryMutations,
    },
  };
}

function collectReferenceIds(posts: PostDocument[]) {
  const ids = new Set<string>();
  for (const post of posts) {
    if (Array.isArray(post.categories)) {
      for (const value of post.categories) {
        const reference = readReference(value);
        if (reference) ids.add(reference._ref);
      }
    }
    const category = readReference(post.category);
    if (category) ids.add(category._ref);
  }
  return [...ids];
}

export function buildTargetTypes(
  targets: Array<{ _id: string; _type: string }>,
) {
  const targetTypes = new Map<string, string>();
  for (const target of targets) {
    for (const id of new Set([target._id, publishedId(target._id)])) {
      const existingType = targetTypes.get(id);
      targetTypes.set(
        id,
        existingType && existingType !== target._type
          ? "conflicting-document-types"
          : target._type,
      );
    }
  }
  return targetTypes;
}

async function run() {
  const apply = process.argv.includes("--apply");
  const client = getCliClient({
    apiVersion: API_VERSION,
    dataset: DATASET,
    perspective: "raw",
  });
  const config = client.config();
  if (config.projectId !== PROJECT_ID || config.dataset !== DATASET) {
    throw new Error(
      `Refusing to run outside ${PROJECT_ID}/${DATASET}; received ${config.projectId}/${config.dataset}`,
    );
  }

  const [posts, categories] = await Promise.all([
    client.fetch<PostDocument[]>(
      `*[_type == "post"] | order(_id asc)`,
    ),
    client.fetch<CategoryDocument[]>(
      `*[_type == "category"] | order(_id asc){_id, _rev, slug}`,
    ),
  ]);
  const referenceIds = collectReferenceIds(posts);
  const targetIds = [
    ...new Set(
      referenceIds.flatMap((id) =>
        id.startsWith("drafts.")
          ? [id, publishedId(id)]
          : [id, `drafts.${id}`],
      ),
    ),
  ];
  const targets = targetIds.length
    ? await client.fetch<Array<{ _id: string; _type: string }>>(
        `*[_id in $ids]{_id, _type}`,
        { ids: targetIds },
      )
    : [];
  const plan = buildMigrationPlan(
    posts,
    categories,
    buildTargetTypes(targets),
  );

  console.log(
    JSON.stringify(buildDryRunReport(plan, apply), null, 2),
  );

  if (plan.fatal.length) {
    throw new Error(`Aborting before writes: ${plan.fatal.length} fatal document(s)`);
  }
  if (!apply) return;

  let transaction = client.transaction();
  for (const mutation of plan.postMutations) {
    transaction = transaction.patch(mutation.id, (patch: Patch) => {
      let guarded = patch.ifRevisionId(mutation.ifRevisionId);
      if (mutation.set) guarded = guarded.set(mutation.set);
      return guarded.unset(mutation.unset);
    });
  }
  for (const mutation of plan.categoryMutations) {
    transaction = transaction.patch(mutation.id, (patch: Patch) =>
      patch.ifRevisionId(mutation.ifRevisionId).set(mutation.set),
    );
  }
  if (plan.postMutations.length || plan.categoryMutations.length) {
    await transaction.commit({ visibility: "sync" });
  }

  const [postsAfter, categoriesAfter] = await Promise.all([
    client.fetch<PostDocument[]>(
      `*[_id in $ids] | order(_id asc)`,
      { ids: posts.map((post: PostDocument) => post._id) },
    ),
    client.fetch<CategoryDocument[]>(
      `*[_id in $ids] | order(_id asc){_id, _rev, slug}`,
      { ids: categories.map((category: CategoryDocument) => category._id) },
    ),
  ]);
  const expectedCategoryRefs = new Map(
    plan.posts.map((post: PostClassification) => [post.id, post.expectedCategoryRef]),
  );
  if (postsAfter.length !== posts.length) {
    throw new Error("Parity audit failed: post version count changed");
  }
  for (const post of postsAfter as PostDocument[]) {
    if (post._hasCategories ?? hasOwn(post, "categories")) {
      throw new Error(`Parity audit failed: ${post._id} retains categories`);
    }
    const actual = readReference(post.category)?._ref;
    if (actual !== expectedCategoryRefs.get(post._id)) {
      throw new Error(`Parity audit failed: ${post._id} category changed`);
    }
  }
  const expectedSlugs = new Map(
    plan.categories.map((category: CategoryClassification) => [
      category.id,
      category.expectedSlug,
    ]),
  );
  if (categoriesAfter.length !== categories.length) {
    throw new Error("Parity audit failed: category version count changed");
  }
  for (const category of categoriesAfter as CategoryDocument[]) {
    if (category.slug?.current !== expectedSlugs.get(category._id)) {
      throw new Error(`Parity audit failed: ${category._id} slug changed`);
    }
  }
  console.log(
    JSON.stringify(
      {
        applied: true,
        posts: postsAfter.length,
        categories: categoriesAfter.length,
        legacyArraysRemaining: 0,
        categoryReferenceParity: true,
        categorySlugParity: true,
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
