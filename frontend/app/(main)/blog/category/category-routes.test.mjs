import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routeSource = readFileSync(new URL("./[slug]/page.tsx", import.meta.url), "utf8");
const paginatedRouteSource = readFileSync(new URL("./[slug]/[page]/page.tsx", import.meta.url), "utf8");
const archiveSource = readFileSync(
  new URL("./_components/category-archive-route.tsx", import.meta.url),
  "utf8",
);
const metadataSource = readFileSync(
  new URL("../../../../sanity/lib/metadata.ts", import.meta.url),
  "utf8",
);

test("category route fetches metadata without stega and 404s unknown slugs", () => {
  for (const source of [routeSource, paginatedRouteSource]) {
    assert.match(source, /sanityFetchMetadata\(\{/);
    assert.match(source, /perspective: "published"/);
    assert.match(source, /if \(!category\) notFound\(\)/);
  }
  assert.match(archiveSource, /const category = await fetchCategory/);
  assert.match(archiveSource, /if \(!category\) notFound\(\)/);
});

test("category routes share the runtime indexability rule and editable fields", () => {
  assert.match(metadataSource, /isIndexableCategory\(/);
  assert.match(metadataSource, /isIndexable[\s\S]*\? "index, follow"[\s\S]*: "noindex, follow"/);
  assert.match(archiveSource, /fieldDataAttribute\?\.\("title"\)/);
  assert.match(archiveSource, /fieldDataAttribute\?\.\("description"\)/);
});
