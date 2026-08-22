import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./sitemap.ts", import.meta.url), "utf8");

test("sitemap emits only eligible category archives without lastModified", () => {
  assert.match(source, /"category"/);
  assert.match(source, /"\/blog\/category\/" \+ slug\.current \+ "\/"/);
  assert.match(source, /isIndexableCategory\(/);
  assert.match(source, /publishedPostFilter/);
  assert.match(source, /_type == "category" => 0\.6/);
  assert.match(source, /_type == "category" => null/);
  assert.match(source, /delete sitemapEntry\.lastModified/);
});
