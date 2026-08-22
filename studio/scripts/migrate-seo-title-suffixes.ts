import { isDeepStrictEqual } from "node:util";
import type { Patch } from "@sanity/client";
import { getCliClient } from "sanity/cli";
import {
  normalizeSeoTitle,
  stripLegacySeoTitleSuffix,
} from "../../shared/seo-title.ts";

const API_VERSION = "2026-08-16";
const ALLOWED_DATASETS = ["development", "production"];
const TARGET_QUERY = `
  *[
    _type in ["homePage", "page", "post", "blogIndex", "category"] &&
    defined(meta.title)
  ] | order(_id asc)
`;

type SeoTitleDocument = {
  _id: string;
  _rev: string;
  _updatedAt: string;
  meta: { title?: string; [key: string]: unknown };
  [key: string]: unknown;
};

function resolveDataset() {
  const flag = process.argv.find((argument) => argument.startsWith("--dataset="));
  const dataset = flag?.slice("--dataset=".length) || "development";
  if (!ALLOWED_DATASETS.includes(dataset)) {
    throw new Error(
      `Unknown dataset ${dataset}; use one of ${ALLOWED_DATASETS.join(", ")}`,
    );
  }
  return dataset;
}

function withoutMutationMetadata(document: SeoTitleDocument) {
  const { _rev, _updatedAt, meta, ...content } = document;
  const { title, ...unchangedMeta } = meta;
  void _rev;
  void _updatedAt;
  void title;
  return { ...content, meta: unchangedMeta };
}

async function main() {
  const apply = process.argv.includes("--apply");
  const dataset = resolveDataset();
  const client = getCliClient({
    apiVersion: API_VERSION,
    dataset,
    perspective: "raw",
    useCdn: false,
  });
  if (client.config().dataset !== dataset) {
    throw new Error(`Refusing to run outside the ${dataset} dataset`);
  }

  const documents: SeoTitleDocument[] = await client.fetch(TARGET_QUERY);
  const mutations = documents.flatMap((document) => {
    const currentTitle = normalizeSeoTitle(document.meta.title);
    const pageTitle = stripLegacySeoTitleSuffix(currentTitle);
    return pageTitle && pageTitle !== currentTitle
      ? [{ document, currentTitle, pageTitle }]
      : [];
  });

  console.log(
    JSON.stringify(
      {
        dataset,
        mode: apply ? "apply" : "dry-run",
        count: mutations.length,
        documents: mutations.map(({ document, currentTitle, pageTitle }) => ({
          _id: document._id,
          from: currentTitle,
          to: pageTitle,
        })),
      },
      null,
      2,
    ),
  );

  if (!apply || mutations.length === 0) return;

  let transaction = client.transaction();
  for (const { document, pageTitle } of mutations) {
    transaction = transaction.patch(document._id, (patch: Patch) =>
      patch.ifRevisionId(document._rev).set({ "meta.title": pageTitle }),
    );
  }
  await transaction.commit({ visibility: "sync" });

  const updatedDocuments: SeoTitleDocument[] = await client.fetch(
    `*[_id in $ids] | order(_id asc)`,
    { ids: mutations.map(({ document }) => document._id) },
  );
  if (updatedDocuments.length !== mutations.length) {
    throw new Error("Verification failed: the document count changed");
  }

  for (const [index, mutation] of mutations.entries()) {
    const updated = updatedDocuments[index];
    if (updated._id !== mutation.document._id) {
      throw new Error("Verification failed: document IDs changed");
    }
    if (updated.meta.title !== mutation.pageTitle) {
      throw new Error(`Verification failed: ${updated._id} has the wrong title`);
    }
    if (
      !isDeepStrictEqual(
        withoutMutationMetadata(mutation.document),
        withoutMutationMetadata(updated),
      )
    ) {
      throw new Error(
        `Verification failed: ${updated._id} changed outside meta.title`,
      );
    }
  }

  const remaining = (
    (await client.fetch(TARGET_QUERY)) as SeoTitleDocument[]
  ).filter((document) => {
      const currentTitle = normalizeSeoTitle(document.meta.title);
      return stripLegacySeoTitleSuffix(currentTitle) !== currentTitle;
    });
  if (remaining.length) {
    throw new Error(
      `Verification failed: ${remaining.length} legacy suffixes remain`,
    );
  }

  console.log(
    JSON.stringify(
      {
        dataset,
        applied: mutations.length,
        remaining: 0,
        unchangedOutsideSeoTitle: true,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
