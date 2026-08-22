import process from "node:process";
import { isDeepStrictEqual } from "node:util";
import { pathToFileURL } from "node:url";
import { createClient } from "@sanity/client";
import { getCliClient } from "sanity/cli";

const FOOTER_ID = "footer";
const LEGACY_FIELDS = ["resources", "social", "brand.mapLink"];

function requiredText(value, message) {
  if (typeof value !== "string" || !value.trim()) throw new Error(message);
  return value;
}

function requiredLink(value, owner) {
  if (!value || typeof value !== "object") throw new Error(`${owner} must be a link object`);
  requiredText(value._key, `${owner} is missing _key`);
  if (value._type !== "footerLink") throw new Error(`${owner} must be a footerLink`);
  requiredText(value.label, `${owner} is missing label`);
  if (!value.destination || typeof value.destination !== "object") {
    throw new Error(`${owner} is missing destination`);
  }
}

function requiredSection(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${name} must be an object`);
  }
  const heading = requiredText(value.heading, `${name} is missing heading`);
  if (!Array.isArray(value.links) || value.links.length === 0) {
    throw new Error(`${name} must have at least one link`);
  }
  value.links.forEach((link, index) => requiredLink(link, `${name}.links[${index}]`));
  return heading;
}

function requiredMapLink(value) {
  requiredLink(value, "brand.mapLink");
  return value;
}

function columnsSummary(columns) {
  return columns.map((column) => ({ heading: column.heading, links: column.links.length }));
}

function isPresent(object, key) {
  return Object.hasOwn(object, key);
}

function isFullyMigrated(source) {
  return (
    Array.isArray(source.columns) &&
    !isPresent(source, "resources") &&
    !isPresent(source, "social") &&
    (!source.brand || !isPresent(source.brand, "mapLink"))
  );
}

function validateMigratedColumns(columns) {
  if (columns.length === 0) throw new Error("Migrated footer has no columns");
  columns.forEach((column, index) => {
    if (!column || typeof column !== "object" || Array.isArray(column)) {
      throw new Error(`columns[${index}] must be an object`);
    }
    requiredText(column._key, `columns[${index}] is missing _key`);
    if (column._type !== "footerColumn") {
      throw new Error(`columns[${index}] must be a footerColumn`);
    }
    requiredSection(column, `columns[${index}]`);
  });
}

export function footerColumnsFromLegacySections(source) {
  if (source?._id !== FOOTER_ID || source?._type !== "footer") {
    throw new Error("Expected the footer singleton");
  }

  if (isFullyMigrated(source)) {
    validateMigratedColumns(source.columns);
    return { columns: source.columns, noOp: true };
  }

  if (isPresent(source, "columns")) {
    throw new Error("Footer is in a hybrid columns/legacy state");
  }
  if (!source.brand || typeof source.brand !== "object" || Array.isArray(source.brand)) {
    throw new Error("Footer is missing brand");
  }
  if (!isPresent(source, "resources") || !isPresent(source, "social") || !isPresent(source.brand, "mapLink")) {
    throw new Error("Footer is missing one or more legacy navigation sections");
  }

  const resourcesHeading = requiredSection(source.resources, "resources");
  const socialHeading = requiredSection(source.social, "social");
  const mapLink = requiredMapLink(source.brand.mapLink);
  return {
    columns: [
      {
        _key: "resources",
        _type: "footerColumn",
        heading: resourcesHeading,
        links: source.resources.links,
      },
      {
        _key: "follow",
        _type: "footerColumn",
        heading: socialHeading,
        links: [...source.social.links, mapLink],
      },
    ],
    noOp: false,
  };
}

export function migrationPatch(source) {
  const { columns, noOp } = footerColumnsFromLegacySections(source);
  return noOp ? null : { set: { columns }, unset: LEGACY_FIELDS };
}

function unchangedOutsideNavigation(source, stored) {
  const ignored = new Set(["_rev", "_updatedAt", "resources", "social", "columns"]);
  const sourceBrand = { ...source.brand };
  const storedBrand = { ...stored.brand };
  delete sourceBrand.mapLink;
  delete storedBrand.mapLink;
  const sourceRest = Object.fromEntries(
    Object.entries(source).filter(([key]) => !ignored.has(key) && key !== "brand"),
  );
  const storedRest = Object.fromEntries(
    Object.entries(stored).filter(([key]) => !ignored.has(key) && key !== "brand"),
  );
  return isDeepStrictEqual({ ...sourceRest, brand: sourceBrand }, { ...storedRest, brand: storedBrand });
}

async function run() {
  process.loadEnvFile(".env");
  process.loadEnvFile("../frontend/.env.local");
  const apply = process.argv.includes("--apply");
  const dataset = requiredText(process.env.SANITY_STUDIO_DATASET, "Missing dataset");
  if (dataset !== "development") {
    throw new Error(`This migration is restricted to the development dataset, not ${dataset}`);
  }
  const projectId = requiredText(process.env.SANITY_STUDIO_PROJECT_ID, "Missing project ID");
  const apiVersion = "2026-08-02";
  const directToken = apply
    ? process.env.SANITY_AUTH_TOKEN
    : process.env.SANITY_AUTH_TOKEN || process.env.SANITY_API_READ_TOKEN;
  const client = directToken
    ? createClient({ apiVersion, dataset, perspective: "raw", projectId, token: directToken, useCdn: false })
    : getCliClient({ apiVersion }).withConfig({ dataset, perspective: "raw", projectId, useCdn: false });
  const source = await client.getDocument(FOOTER_ID);
  if (!source) throw new Error("Missing footer singleton");
  const patch = migrationPatch(source);
  const columns = patch?.set.columns ?? source.columns;
  console.log(JSON.stringify({ dataset, mode: apply ? "apply" : "dry-run", noOp: !patch, columns: columnsSummary(columns) }));
  if (!apply || !patch) return;

  await client.patch(FOOTER_ID).ifRevisionId(source._rev).set(patch.set).unset(patch.unset).commit({ visibility: "sync" });
  const stored = await client.getDocument(FOOTER_ID);
  if (!stored || !isDeepStrictEqual(stored.columns, patch.set.columns)) {
    throw new Error("Stored footer columns do not exactly match the migration output");
  }
  if (isPresent(stored, "resources") || isPresent(stored, "social") || isPresent(stored.brand ?? {}, "mapLink")) {
    throw new Error("Stored footer retains legacy navigation fields");
  }
  if (!unchangedOutsideNavigation(source, stored)) {
    throw new Error("Stored footer changed outside the navigation migration");
  }
  console.log(JSON.stringify({ applied: true, targetRevision: stored._rev, verified: true }));
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
