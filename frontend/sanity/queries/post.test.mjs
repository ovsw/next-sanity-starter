import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const postSource = readFileSync(new URL("./post.ts", import.meta.url), "utf8");

test("published post route requires a publish date", () => {
  assert.match(postSource, /PUBLISHED_POST_QUERY[\s\S]*publishedPostFilter/);
  assert.match(postSource, /PUBLISHED_POST_QUERY[\s\S]*ROOT_SLUG_FILTER/);
});

test("draft post route still allows draft-only posts", () => {
  assert.match(postSource, /POST_QUERY = groq`\*\[_type == "post" && \$\{ROOT_SLUG_FILTER\}\]/);
});
