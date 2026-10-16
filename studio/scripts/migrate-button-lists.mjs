#!/usr/bin/env node
// Run from studio: node --env-file=.env.local scripts/migrate-button-lists.mjs
// Add --apply only after the backup steps in docs/agents/sanity-cli.md.
import { pathToFileURL } from "node:url";

/** Remove style fields only from the shared button and link types. */
export function stylePaths(value, path = "") {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => stylePaths(entry, `${path}[${index}]`));
  }
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, entry]) => {
    const next = path ? `${path}.${key}` : key;
    const isStyle =
      (key === "variant" && ["button", "buttonLink"].includes(value._type)) ||
      (key === "buttonVariant" && value._type === "link");
    return isStyle ? [next] : stylePaths(entry, next);
  });
}

export function migrationPlan(documents) {
  return documents.flatMap((document) => {
    const unset = stylePaths(document);
    return unset.length ? [{ id: document._id, revision: document._rev, unset }] : [];
  });
}

// Sanity caps a query's working set and a mutation request's size, so the
// migration reads documents in pages and commits patches in bounded batches.
const PAGE_SIZE = 500;
const BATCH_SIZE = 100;
const DOCUMENTS_QUERY = `*[
  !(_type match "sanity.*") &&
  _id > $after
] | order(_id) [0...${PAGE_SIZE}]`;

async function fetchDocuments(client) {
  const documents = [];
  let after = "";
  for (;;) {
    const page = await client.fetch(DOCUMENTS_QUERY, { after }, { perspective: "raw" });
    documents.push(...page);
    if (page.length < PAGE_SIZE) return documents;
    after = page.at(-1)._id;
  }
}

export async function migrate(client, { apply = false, log = console.log } = {}) {
  const documents = await fetchDocuments(client);
  const changes = migrationPlan(documents);
  for (const change of changes) {
    log(`${apply ? "patch" : "would patch"} ${change.id}: remove ${change.unset.join(", ")}`);
  }
  log(`${changes.length} of ${documents.length} documents need changes.`);
  if (!apply || !changes.length) return changes;
  for (const change of changes) {
    if (!change.revision) throw new Error(`Missing revision for ${change.id}`);
  }
  for (let start = 0; start < changes.length; start += BATCH_SIZE) {
    const transaction = client.transaction();
    for (const change of changes.slice(start, start + BATCH_SIZE)) {
      transaction.patch(change.id, (patch) =>
        patch.ifRevisionId(change.revision).unset(change.unset),
      );
    }
    const result = await transaction.commit();
    log(`Committed transaction ${result.transactionId}.`);
  }
  return changes;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--apply")) throw new Error("Usage: migrate-button-lists.mjs [--apply]");
  const { getCliClient } = await import("sanity/cli");
  const client = getCliClient({ apiVersion: "2026-03-23" }).withConfig({ useCdn: false });
  const { projectId, dataset } = client.config();
  console.log(`Target: ${projectId}/${dataset}. Environment: studio/.env.local and shell overrides.`);
  await migrate(client, { apply: args.includes("--apply") });
}
