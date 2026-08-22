import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const postSource = readFileSync(new URL("./post.ts", import.meta.url), "utf8");
const postQueryLine = postSource
  .split("\n")
  .find((line) => line.includes("export const POST_QUERY"));

test("published post route requires a publish date", () => {
  assert.match(
    postSource,
    /import \{ publishedPostFilter \} from "\.\/blog-post-listing"/,
  );
  assert.match(
    postSource,
    /PUBLISHED_POST_QUERY = groq`\*\[\s*\$\{publishedPostFilter\} && \$\{ROOT_SLUG_FILTER\}\s*\]\[0\]\$\{POST_PROJECTION\}`/,
  );
});

test("draft post route still allows draft-only posts", () => {
  assert.match(
    postSource,
    /POST_QUERY = groq`\*\[_type == "post" && \$\{ROOT_SLUG_FILTER\}\]\[0\]\$\{POST_PROJECTION\}`/,
  );
  assert.doesNotMatch(postQueryLine ?? "", /publishedPostFilter/);
});
