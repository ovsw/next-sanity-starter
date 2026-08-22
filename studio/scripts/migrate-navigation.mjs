import process from "node:process";
import { isDeepStrictEqual } from "node:util";
import { pathToFileURL } from "node:url";
import { createClient } from "@sanity/client";

const LEGACY_ID = "navbar";
const NAVIGATION_ID = "navigation";
const EXPECTED_SUMMARY = { actions: 1, childLinks: 15, directLinks: 1, groups: 4, items: 5 };

function required(value, message) {
  if (typeof value !== "string" || !value.trim()) throw new Error(message);
  return value.trim();
}

function transformDestination(url, owner) {
  if (url?.type === "internal" && url.internal?._ref) {
    return {
      _type: "navigationDestination",
      kind: "internal",
      internal: { _type: "reference", _ref: url.internal._ref },
      openInNewTab: Boolean(url.openInNewTab),
    };
  }

  const external = url?.external || url?.href;
  if (!external) throw new Error(`${owner} is missing a destination`);
  return {
    _type: "navigationDestination",
    kind: "external",
    external,
    openInNewTab: Boolean(url.openInNewTab),
  };
}

function normalizeIcon(icon) {
  return { users2: "users-2", building2: "building-2" }[icon] || icon;
}

export function transformLegacyNavbar(source) {
  if (source?._id !== LEGACY_ID || source?._type !== "navbar") {
    throw new Error(`Expected ${LEGACY_ID} legacy navbar document`);
  }
  if (!Array.isArray(source.columns) || source.columns.length === 0) {
    throw new Error("Legacy navbar has no primary navigation items");
  }

  const items = source.columns.map((item) => {
    const key = required(item._key, "Navigation item is missing _key");
    if (item._type === "navbarLink") {
      const label = required(item.name, `${key} is missing a label`);
      return {
        _key: key,
        _type: "navigationLink",
        label,
        destination: transformDestination(item.url, key),
      };
    }
    if (item._type !== "navbarColumn") throw new Error(`${key} has unsupported type ${item._type}`);
    if (!Array.isArray(item.links) || item.links.length === 0) {
      throw new Error(`${key} has no child links`);
    }
    return {
      _key: key,
      _type: "navigationGroup",
      label: required(item.title, `${key} is missing a label`),
      links: item.links.map((link) => {
        const childKey = required(link._key, `${key} child is missing _key`);
        return {
          _key: childKey,
          _type: "navigationChildLink",
          label: required(link.name, `${childKey} is missing a label`),
          description: required(link.description, `${childKey} is missing a description`),
          icon: required(normalizeIcon(link.icon), `${childKey} is missing an icon`),
          destination: transformDestination(link.url, childKey),
        };
      }),
    };
  });

  const actions = (source.buttons || []).map((button) => {
    const key = required(button._key, "Navigation action is missing _key");
    return {
      _key: key,
      _type: "navigationAction",
      label: required(button.text, `${key} is missing a label`),
      destination: transformDestination(button.url, key),
    };
  });

  return { _id: NAVIGATION_ID, _type: "navigation", items, actions };
}

function contentShape(document) {
  if (!document) return null;
  const { _createdAt, _rev, _system, _updatedAt, ...content } = document;
  return content;
}

function summarize(document) {
  const groups = document.items.filter((item) => item._type === "navigationGroup");
  return {
    actions: document.actions.length,
    childLinks: groups.reduce((total, group) => total + group.links.length, 0),
    directLinks: document.items.filter((item) => item._type === "navigationLink").length,
    groups: groups.length,
    items: document.items.length,
  };
}

async function run() {
  process.loadEnvFile(".env");
  process.loadEnvFile("../frontend/.env.local");
  const apply = process.argv.includes("--apply");
  const projectId = required(process.env.SANITY_STUDIO_PROJECT_ID, "Missing project ID");
  const dataset = required(process.env.SANITY_STUDIO_DATASET, "Missing dataset");
  const token = required(
    process.env.SANITY_AUTH_TOKEN || process.env.SANITY_API_READ_TOKEN,
    "Missing Sanity token",
  );
  const client = createClient({
    apiVersion: "2026-08-02",
    dataset,
    perspective: "raw",
    projectId,
    token,
    useCdn: false,
  });

  const [source, existing] = await Promise.all([
    client.getDocument(LEGACY_ID),
    client.getDocument(NAVIGATION_ID),
  ]);

  if (!source) {
    if (!existing) throw new Error("Neither legacy nor canonical navigation exists");
    const summary = summarize(existing);
    if (!isDeepStrictEqual(summary, EXPECTED_SUMMARY)) {
      throw new Error(`Unexpected canonical inventory: ${JSON.stringify(summary)}`);
    }
    console.log(JSON.stringify({ dataset, mode: apply ? "apply" : "dry-run", noOp: true, summary }));
    return;
  }

  const transformed = transformLegacyNavbar(source);
  const summary = summarize(transformed);
  if (!isDeepStrictEqual(summary, EXPECTED_SUMMARY)) {
    throw new Error(`Unexpected source inventory: ${JSON.stringify(summary)}`);
  }

  console.log(JSON.stringify({ dataset, mode: apply ? "apply" : "dry-run", sourceRevision: source._rev, summary }));
  if (!apply) return;

  let transaction = client
    .transaction()
    .patch(LEGACY_ID, (patch) => patch.ifRevisionId(source._rev).set({ _type: source._type }));
  if (existing) {
    transaction = transaction.patch(NAVIGATION_ID, (patch) =>
      patch.ifRevisionId(existing._rev).set({ _type: existing._type }),
    );
  }
  await transaction
    .createOrReplace(transformed)
    .delete(LEGACY_ID)
    .commit({ visibility: "sync" });
  const [targetAfter, sourceAfter] = await Promise.all([
    client.getDocument(NAVIGATION_ID),
    client.getDocument(LEGACY_ID),
  ]);
  if (sourceAfter) throw new Error("Legacy navbar still exists after migration");
  if (!isDeepStrictEqual(contentShape(targetAfter), transformed)) {
    throw new Error("Stored canonical navigation does not match the transform");
  }
  console.log(JSON.stringify({ applied: true, targetRevision: targetAfter._rev, verified: true }));
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
