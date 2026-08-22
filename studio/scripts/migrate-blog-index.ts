import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import type { Patch } from "@sanity/client";
import { getCliClient } from "sanity/cli";

const API_VERSION = "2026-03-23";
const DATASET = "development";

type BlogIndexDocument = {
  _id: string;
  _rev: string;
  _type: string;
  blocks?: unknown[];
  displayFeaturedBlogs?: unknown;
  featuredBlogsCount?: unknown;
  pageBuilder?: unknown[];
  slug?: { current?: unknown };
  title?: unknown;
  [key: string]: unknown;
};

export function validateBlogIndexBeforeMigration(
  document: BlogIndexDocument,
): string | undefined {
  if (document._id !== "blogIndex" || document._type !== "blogIndex") {
    return "Expected the published blogIndex document with ID blogIndex";
  }
  if (!document._rev) return "The current revision is required";
  if (typeof document.title !== "string" || !document.title.trim()) {
    return "A non-empty title is required";
  }
  if (Object.hasOwn(document, "blocks")) return "blocks must be absent";
  if (
    document.pageBuilder?.length !== 1 ||
    (document.pageBuilder[0] as { _type?: unknown } | undefined)?._type !==
      "advisorCta"
  ) {
    return "pageBuilder must contain exactly one advisorCta";
  }
  if (document.slug?.current !== "/blog") {
    return "slug.current must be /blog";
  }
  if (document.displayFeaturedBlogs !== "yes") {
    return "displayFeaturedBlogs must be yes";
  }
  if (document.featuredBlogsCount !== "1") {
    return "featuredBlogsCount must be 1";
  }
  return undefined;
}

export function buildBlogIndexMutation(document: BlogIndexDocument) {
  const validationError = validateBlogIndexBeforeMigration(document);
  if (validationError) throw new Error(validationError);
  return {
    id: document._id,
    ifRevisionID: document._rev,
    set: { blocks: document.pageBuilder! },
    unset: [
      "pageBuilder",
      "slug",
      "displayFeaturedBlogs",
      "featuredBlogsCount",
    ],
  };
}

function withoutCutoverFields(document: BlogIndexDocument) {
  const {
    _rev,
    _updatedAt,
    blocks,
    displayFeaturedBlogs,
    featuredBlogsCount,
    pageBuilder,
    slug,
    ...unchanged
  } = document;
  void _rev;
  void _updatedAt;
  void blocks;
  void displayFeaturedBlogs;
  void featuredBlogsCount;
  void pageBuilder;
  void slug;
  return unchanged;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const client = getCliClient({
    apiVersion: API_VERSION,
    dataset: DATASET,
    perspective: "raw",
  });
  if (client.config().dataset !== DATASET) {
    throw new Error(`Refusing to run outside the ${DATASET} dataset`);
  }

  const [documents, otherAdvisorCtas, referrers] = await Promise.all([
    client.fetch<BlogIndexDocument[]>(
      `*[_id in ["blogIndex", "drafts.blogIndex"]]`,
    ),
    client.fetch<Array<{ _id: string; _type: string }>>(
      `*[!(_id in ["blogIndex", "drafts.blogIndex"]) && count((coalesce(blocks, []) + coalesce(pageBuilder, []))[_type == "advisorCta"]) > 0]{_id, _type}`,
    ),
    client.fetch<Array<{ _id: string; _type: string }>>(
      `*[references("blogIndex")]{_id, _type}`,
    ),
  ]);

  if (documents.length !== 1) {
    throw new Error(`Expected one published blogIndex and no draft; found ${documents.length}`);
  }
  if (otherAdvisorCtas.length) {
    throw new Error(`advisorCta exists on other documents: ${JSON.stringify(otherAdvisorCtas)}`);
  }
  if (referrers.length) {
    throw new Error(`blogIndex has referrers: ${JSON.stringify(referrers)}`);
  }

  const before = documents[0];
  const mutation = buildBlogIndexMutation(before);
  console.log(JSON.stringify({ dataset: DATASET, mode: apply ? "apply" : "dry-run", mutation }, null, 2));
  if (!apply) return;

  await client
    .transaction()
    .patch(mutation.id, (patch: Patch) =>
      patch
        .ifRevisionId(mutation.ifRevisionID)
        .set(mutation.set)
        .unset(mutation.unset),
    )
    .commit({ visibility: "sync" });

  const after = await client.fetch<BlogIndexDocument>(`*[_id == "blogIndex"][0]`);
  for (const field of mutation.unset) {
    if (Object.hasOwn(after, field)) {
      throw new Error(`Verification failed: ${field} still exists`);
    }
  }
  if (!isDeepStrictEqual(after.blocks, before.pageBuilder)) {
    throw new Error("Verification failed: blocks is not an exact pageBuilder copy");
  }
  if (!isDeepStrictEqual(withoutCutoverFields(after), withoutCutoverFields(before))) {
    throw new Error("Verification failed: fields outside the cutover changed");
  }

  console.log(JSON.stringify({
    applied: 1,
    documentId: after._id,
    fieldsRemoved: mutation.unset,
    blocksCount: after.blocks?.length,
    blocksExactCopy: true,
    unchangedOutsideCutover: true,
  }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
