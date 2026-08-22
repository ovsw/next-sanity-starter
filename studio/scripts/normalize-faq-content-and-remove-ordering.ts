import { isDeepStrictEqual } from "node:util";
import type { Patch } from "@sanity/client";
import { getCliClient } from "sanity/cli";

// Development-only cleanup. Runs as a dry run unless explicitly passed --apply:
// node --env-file=.env --experimental-strip-types scripts/normalize-faq-content-and-remove-ordering.ts [--apply]
const API_VERSION = "2026-03-23";
const DATASET = "development";
const ORDERED_DOCUMENT_TYPES = [
  "author",
  "category",
  "faq",
  "testimonial",
] as const;
const TARGET_QUERY = /* groq */ `
  *[
    _type in $documentTypes &&
    (defined(orderRank) || (_type == "faq" && defined(richText)))
  ] | order(_id asc)
`;

type TargetDocument = {
  _id: string;
  _rev: string;
  _type: string;
  _updatedAt: string;
  body?: unknown;
  orderRank?: string;
  richText?: unknown;
  [key: string]: unknown;
};

function contentWithoutMutationMetadata(document: TargetDocument) {
  const { _rev, _updatedAt, ...content } = document;
  void _rev;
  void _updatedAt;
  return content;
}

function expectedContent(document: TargetDocument) {
  const content = contentWithoutMutationMetadata(document);
  delete content.orderRank;

  if (document._type === "faq") {
    if (content.body === undefined && content.richText !== undefined) {
      content.body = content.richText;
    }
    delete content.richText;
  }

  return content;
}

function plannedOperations(document: TargetDocument) {
  const operations: string[] = [];

  if (
    document._type === "faq" &&
    document.body === undefined &&
    document.richText !== undefined
  ) {
    operations.push("copy richText to body");
  }
  if (document._type === "faq" && document.richText !== undefined) {
    operations.push("unset richText");
  }
  if (document.orderRank !== undefined) {
    operations.push("unset orderRank");
  }

  return operations;
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

  const before = (await client.fetch(TARGET_QUERY, {
    documentTypes: ORDERED_DOCUMENT_TYPES,
  })) as TargetDocument[];
  console.log(
    JSON.stringify(
      {
        dataset: DATASET,
        mode: apply ? "apply" : "dry-run",
        documents: before.map((document) => ({
          _id: document._id,
          _type: document._type,
          operations: plannedOperations(document),
        })),
        count: before.length,
      },
      null,
      2,
    ),
  );

  if (!apply || before.length === 0) return;

  let transaction = client.transaction();
  for (const document of before) {
    transaction = transaction.patch(document._id, (patch: Patch) => {
      let guardedPatch = patch.ifRevisionId(document._rev);

      if (
        document._type === "faq" &&
        document.body === undefined &&
        document.richText !== undefined
      ) {
        guardedPatch = guardedPatch.set({ body: document.richText });
      }

      const fieldsToUnset = [
        document._type === "faq" && document.richText !== undefined
          ? "richText"
          : undefined,
        document.orderRank !== undefined ? "orderRank" : undefined,
      ].filter((field): field is string => field !== undefined);

      return fieldsToUnset.length > 0
        ? guardedPatch.unset(fieldsToUnset)
        : guardedPatch;
    });
  }
  await transaction.commit({ visibility: "sync" });

  const after = (await client.fetch(
    `*[_id in $ids] | order(_id asc)`,
    { ids: before.map((document) => document._id) },
  )) as TargetDocument[];
  if (after.length !== before.length) {
    throw new Error("Verification failed: the document count changed");
  }

  for (const [index, document] of before.entries()) {
    const updated = after[index];
    if (document._id !== updated._id) {
      throw new Error("Verification failed: document IDs changed");
    }
    if (
      !isDeepStrictEqual(
        expectedContent(document),
        contentWithoutMutationMetadata(updated),
      )
    ) {
      throw new Error(
        `Verification failed: ${updated._id} changed outside the planned fields`,
      );
    }
  }

  const remaining = await client.fetch<{
    faqMissingBody: number;
    orderRanks: number;
    richText: number;
  }>(
    /* groq */ `{
      "faqMissingBody": count(*[_id in $faqBodyIds && !defined(body)]),
      "orderRanks": count(*[_type in $documentTypes && defined(orderRank)]),
      "richText": count(*[_type == "faq" && defined(richText)])
    }`,
    {
      documentTypes: ORDERED_DOCUMENT_TYPES,
      faqBodyIds: before
        .filter(
          (document) =>
            document._type === "faq" && document.richText !== undefined,
        )
        .map((document) => document._id),
    },
  );
  if (
    remaining.faqMissingBody !== 0 ||
    remaining.orderRanks !== 0 ||
    remaining.richText !== 0
  ) {
    throw new Error(`Verification failed: ${JSON.stringify(remaining)}`);
  }

  console.log(
    JSON.stringify(
      {
        dataset: DATASET,
        applied: before.length,
        remaining,
        unchangedOutsidePlannedFields: true,
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
