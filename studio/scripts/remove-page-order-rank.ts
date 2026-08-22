import { isDeepStrictEqual } from "node:util";
import type { Patch } from "@sanity/client";
import { getCliClient } from "sanity/cli";

const API_VERSION = "2026-03-23";
const DATASET = "development";
const TARGET_QUERY = `*[_type == "page" && defined(orderRank)] | order(_id asc)`;

type PageDocument = {
  _id: string;
  _rev: string;
  _updatedAt: string;
  orderRank: string;
  [key: string]: unknown;
};

function withoutMutationMetadata(document: PageDocument) {
  const { _rev, _updatedAt, orderRank, ...unchangedContent } = document;
  void _rev;
  void _updatedAt;
  void orderRank;
  return unchangedContent;
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

  const before = (await client.fetch(TARGET_QUERY)) as PageDocument[];
  console.log(
    JSON.stringify(
      {
        dataset: DATASET,
        mode: apply ? "apply" : "dry-run",
        mutation: { operation: "unset", field: "orderRank" },
        documents: before.map(
          ({ _id, orderRank }: PageDocument) => ({ _id, orderRank }),
        ),
        count: before.length,
      },
      null,
      2,
    ),
  );

  if (!apply || before.length === 0) return;

  let transaction = client.transaction();
  for (const document of before) {
    transaction = transaction.patch(document._id, (patch: Patch) =>
      patch.ifRevisionId(document._rev).unset(["orderRank"]),
    );
  }
  await transaction.commit({ visibility: "sync" });

  const after = await client.fetch<PageDocument[]>(
    `*[_id in $ids] | order(_id asc)`,
    { ids: before.map(({ _id }: PageDocument) => _id) },
  );
  if (after.length !== before.length) {
    throw new Error("Verification failed: the page document count changed");
  }

  for (const [index, document] of before.entries()) {
    const updated = after[index];
    if (document._id !== updated._id) {
      throw new Error("Verification failed: page document IDs changed");
    }
    if ("orderRank" in updated) {
      throw new Error(`Verification failed: ${updated._id} still has orderRank`);
    }
    if (
      !isDeepStrictEqual(
        withoutMutationMetadata(document),
        withoutMutationMetadata(updated),
      )
    ) {
      throw new Error(
        `Verification failed: ${updated._id} changed outside orderRank`,
      );
    }
  }

  const remaining = await client.fetch<number>(
    `count(*[_type == "page" && defined(orderRank)])`,
  );
  if (remaining !== 0) {
    throw new Error(`Verification failed: ${remaining} page versions remain`);
  }

  console.log(
    JSON.stringify(
      {
        dataset: DATASET,
        applied: before.length,
        remaining: 0,
        unchangedOutsideOrderRank: true,
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
