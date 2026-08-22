import assert from "node:assert/strict";
import test from "node:test";

import {
  buildBlogIndexMutation,
  validateBlogIndexBeforeMigration,
} from "./migrate-blog-index.ts";

const advisorCta = {
  _key: "blog-advisors-cta",
  _type: "advisorCta",
  buttons: [{ _key: "apply", _type: "button", text: "Apply" }],
  portraitImage: { _type: "image", asset: { _ref: "image-123", _type: "reference" } },
  richText: [{ _key: "copy", _type: "block", children: [] }],
};

const source = {
  _id: "blogIndex",
  _rev: "current-revision",
  _type: "blogIndex",
  displayFeaturedBlogs: "yes",
  featuredBlogsCount: "1",
  pageBuilder: [advisorCta],
  slug: { _type: "slug", current: "/blog" },
  title: "Blog",
};

test("accepts only the exact expected pre-migration document shape", () => {
  assert.equal(validateBlogIndexBeforeMigration(source), undefined);
  assert.match(
    validateBlogIndexBeforeMigration({ ...source, blocks: [] }),
    /blocks must be absent/,
  );
  assert.match(
    validateBlogIndexBeforeMigration({ ...source, pageBuilder: [{ ...advisorCta, _type: "pageHeader" }] }),
    /exactly one advisorCta/,
  );
});

test("builds one revision-guarded mutation that preserves the existing array verbatim", () => {
  assert.deepEqual(buildBlogIndexMutation(source), {
    id: "blogIndex",
    ifRevisionID: "current-revision",
    set: { blocks: source.pageBuilder },
    unset: [
      "pageBuilder",
      "slug",
      "displayFeaturedBlogs",
      "featuredBlogsCount",
    ],
  });
  assert.equal(buildBlogIndexMutation(source).set.blocks[0], advisorCta);
});
