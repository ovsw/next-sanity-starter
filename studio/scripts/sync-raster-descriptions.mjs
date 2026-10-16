// Copy Raster descriptions to unambiguous Sanity images. See docs/agents/raster-descriptions.md.
import { createClient } from "@sanity/client";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { pathToFileURL } from "node:url";

const RASTER_API_VERSION = "2026-05-20";
const PAGE_SIZE = 50;
const TRANSACTION_SIZE = 50;

export async function syncRaster({ args = process.argv.slice(2), env = process.env, fetchImpl = fetch, clientFactory = createClient, log = console.log } = {}) {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--library" && args[i + 1] && !args[i + 1].startsWith("--")) { i++; continue; }
    if (args[i] === "--apply" || args[i] === "--overwrite") continue;
    throw new Error("Usage: pnpm raster:sync [--library <id>] [--apply] [--overwrite]");
  }
  const APPLY = args.includes("--apply");
  const OVERWRITE = args.includes("--overwrite");
  const libraryIndex = args.indexOf("--library");
  const requestedLibraryId = libraryIndex === -1 ? "" : (args[libraryIndex + 1] ?? "");
  if (libraryIndex !== -1 && !requestedLibraryId) {
    throw new Error("Usage: sync-raster-descriptions.mjs [--library <raster-library-id>] [--apply] [--overwrite]");
  }

  for (const name of [
    "SANITY_STUDIO_PROJECT_ID",
    "SANITY_STUDIO_DATASET",
    "SANITY_AUTH_TOKEN",
    "RASTER_API_KEY",
    "RASTER_ORG_ID",
  ]) {
    if (!env[name]?.trim()) throw new Error(`Missing ${name} in studio/.env.local`);
  }

  const projectId = env.SANITY_STUDIO_PROJECT_ID.trim();
  const dataset = env.SANITY_STUDIO_DATASET.trim();
  const rasterOrgId = env.RASTER_ORG_ID.trim();
  const rasterApiKey = env.RASTER_API_KEY.trim();


  const sanity = clientFactory({
    apiVersion: "2026-03-23",
    dataset,
    projectId,
    token: env.SANITY_AUTH_TOKEN.trim(),
    useCdn: false,
  });

  const rasterBase = `https://api.raster.app/organizations/${encodeURIComponent(rasterOrgId)}`;
  const rasterHeaders = {
    Authorization: `Bearer ${rasterApiKey}`,
    "Api-Version": RASTER_API_VERSION,
  };

  async function rasterGet(path) {
    const response = await fetchImpl(`${rasterBase}${path}`, { headers: rasterHeaders });
    if (!response.ok) throw new Error(`Raster ${response.status} ${path}: ${await response.text()}`);
    const { data } = await response.json();
    if (!Array.isArray(data)) throw new Error(`Invalid Raster response for ${path}`);
    return data;
  }

  async function listRasterAssets(libraryId) {
    const assets = [];
    for (let page = 1; ; page += 1) {
      const data = await rasterGet(
        `/libraries/${encodeURIComponent(libraryId)}/assets?page=${page}&pageSize=${PAGE_SIZE}`,
      );
      assets.push(...data);
      if (data.length < PAGE_SIZE) break;
    }
    return assets;
  }

  // Libraries carry no creation date, so the default library is the one whose
  // newest asset was uploaded most recently. Unlike the assets endpoint,
  // `/libraries` is not paginated: it returns every library in one call, and
  // returns an empty list if `page` is passed. Do not add paging here.
  async function findMostRecentlyUploadedLibrary() {
    let best = null;
    for (const library of await rasterGet("/libraries")) {
      const assets = await listRasterAssets(library.id);
      const newest = Math.max(0, ...assets.map((asset) => Number(asset.created) || 0));
      if (!best || newest > best.newest) best = { id: library.id, newest, assets };
    }
    if (!best) throw new Error("No Raster libraries visible to this API key");
    return best;
  }

  const stem = (filename) =>
    filename
      .trim()
      .replace(/\.[a-z0-9]+$/i, "")
      .toLowerCase();

  const selected = requestedLibraryId
    ? { id: requestedLibraryId, assets: await listRasterAssets(requestedLibraryId) }
    : await findMostRecentlyUploadedLibrary();
  const RASTER_LIBRARY_ID = selected.id;
  const rasterAssets = selected.assets;
  const descriptionByStem = new Map();
  const ambiguousStems = new Set();
  const seenStems = new Set();
  let undescribedInRaster = 0;
  for (const asset of rasterAssets) {
    const name = typeof asset.name === "string" ? asset.name.trim().toLowerCase() : "";
    const description = typeof asset.description === "string" ? asset.description.trim() : "";
    if (!name) continue;
    if (seenStems.has(name)) ambiguousStems.add(name);
    seenStems.add(name);
    if (!description) {
      undescribedInRaster += 1;
      continue;
    }
    descriptionByStem.set(name, description);
  }

  const sanityAssets = await sanity.fetch(
    `*[_type == "sanity.imageAsset"]{_id, _rev, originalFilename, description}`,
  );

  // Two Sanity assets can share one stem, for example `cabin.jpg` and
  // `cabin.png`. That is a one-to-many match, so the description could land on an
  // unrelated image. Group first, then patch only the stems that hold one asset.
  const sanityAssetsByStem = new Map();
  for (const asset of sanityAssets) {
    const key = asset.originalFilename ? stem(asset.originalFilename) : "";
    if (!key) continue;
    if (!sanityAssetsByStem.has(key)) sanityAssetsByStem.set(key, []);
    sanityAssetsByStem.get(key).push(asset);
  }

  const patches = [];
  const skippedDescribed = [];
  const duplicateStems = [];
  const matchedStems = new Set();
  for (const [key, assets] of sanityAssetsByStem) {
    const description = ambiguousStems.has(key) ? undefined : descriptionByStem.get(key);
    if (!description) continue;
    matchedStems.add(key);
    if (assets.length > 1) {
      duplicateStems.push(`${key} (${assets.length} Sanity assets)`);
      continue;
    }
    const [asset] = assets;
    if (asset.description?.trim() && !OVERWRITE) {
      skippedDescribed.push(asset.originalFilename);
      continue;
    }
    if (asset.description?.trim() === description) continue;
    patches.push({ id: asset._id, revision: asset._rev, filename: asset.originalFilename, description });
  }
  const unmatchedRaster = [...descriptionByStem.keys()].filter((key) => !matchedStems.has(key));

  log(`Mode: ${APPLY ? "apply" : "dry-run"} (${projectId}/${dataset}, Raster library "${RASTER_LIBRARY_ID}"${requestedLibraryId ? "" : ", most recently uploaded"})`);
  log(`Raster assets: ${rasterAssets.length} (${descriptionByStem.size} described, ${undescribedInRaster} still undescribed, ${ambiguousStems.size} ambiguous names skipped)`);
  log(`Sanity image assets: ${sanityAssets.length}`);
  log(`To patch: ${patches.length}`);
  if (ambiguousStems.size) log([...ambiguousStems].map((name) => `  - Ambiguous Raster stem: ${name}`).join("\n"));
  if (patches.length) log(patches.map((patch) => `  - ${patch.filename}`).join("\n"));
  log(`Matched but already described (kept): ${skippedDescribed.length}`);
  log(`Duplicate Sanity filenames skipped: ${duplicateStems.length}`);
  if (duplicateStems.length) log(duplicateStems.map((name) => `  - ${name}`).join("\n"));
  log(`Raster assets with no Sanity match: ${unmatchedRaster.length}`);
  if (unmatchedRaster.length) log(unmatchedRaster.map((name) => `  - ${name}`).join("\n"));

  if (!APPLY) {
    log("Dry run. Re-run with --apply to write.");
    return;
  }

  for (let index = 0; index < patches.length; index += TRANSACTION_SIZE) {
    const transaction = patches
      .slice(index, index + TRANSACTION_SIZE)
      .reduce(
        (current, { id, revision, description }) => current.patch(id, (patch) => patch.ifRevisionId(revision).set({ description })),
        sanity.transaction(),
      );
    await transaction.commit({ visibility: "sync" });
    log(`Patched ${Math.min(index + TRANSACTION_SIZE, patches.length)}/${patches.length}`);
  }

}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = new URL("../.env.local", import.meta.url);
  if (existsSync(file)) loadEnvFile(file);
  await syncRaster();
}
