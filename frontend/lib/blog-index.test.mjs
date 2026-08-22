import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  BLOG_POSTS_PER_PAGE,
  calculateBlogPagination,
  getCategoryArchivePath,
  getCategoryPaginatedStaticParams,
  getCategoryStaticParams,
  getBlogCanonicalPath,
  getBlogPageTitle,
  getBlogPaginationUrl,
  getBlogPostWindow,
  getRegularPostQueryParams,
  getBlogResultsLabel,
  isIndexableCategory,
  parseBlogPageSegment,
  isBlogPageOutOfRange,
} from "./blog-index.ts";

test("keeps 12 regular posts per page and calculates five pages for 57 posts", () => {
  assert.equal(BLOG_POSTS_PER_PAGE, 12);
  assert.deepEqual(calculateBlogPagination(57, 1), {
    currentPage: 1,
    hasNextPage: true,
    hasPreviousPage: false,
    itemsPerPage: 12,
    totalItems: 57,
    totalPages: 5,
  });
});

test("calculates regular-post query windows independently of the latest post", () => {
  assert.deepEqual(getBlogPostWindow(1), { end: 12, start: 0 });
  assert.deepEqual(getBlogPostWindow(2), { end: 24, start: 12 });
  assert.deepEqual(getBlogPostWindow(5), { end: 60, start: 48 });
});

test("passes the latest post ID as an explicit regular-list exclusion", () => {
  assert.deepEqual(getRegularPostQueryParams("latest-post", 2), {
    end: 24,
    latestPostId: "latest-post",
    start: 12,
  });
});

test("the regular-post GROQ excludes the one latest post and uses deterministic ordering", () => {
  const source = readFileSync(
    new URL("../sanity/queries/blog-index.ts", import.meta.url),
    "utf8",
  );
  const listingSource = readFileSync(
    new URL("../sanity/queries/blog-post-listing.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /_id != \$latestPostId/);
  assert.match(listingSource, /publishedAt desc, _createdAt desc, _id asc/);
  assert.match(source, /order\(\$\{blogPostOrder\}\)\[0\]/);
});

test("latest-posts sections use the same published-post rule as blog archives", () => {
  const source = readFileSync(
    new URL("../sanity/queries/latest-articles.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /publishedPostFilter/);
  assert.doesNotMatch(source, /coalesce\(publishedAt, _createdAt\)/);
  assert.match(source, /publishedAt,/);
});

test("listing cards expose every visible post field to Presentation", () => {
  const cardSource = readFileSync(
    new URL("../components/blog-card.tsx", import.meta.url),
    "utf8",
  );
  const querySource = readFileSync(
    new URL("../sanity/queries/blog-index.ts", import.meta.url),
    "utf8",
  );

  for (const path of ["excerpt", "image", "publishedAt", "title"]) {
    assert.match(cardSource, new RegExp(`dataAttribute\\?\\.\\("${path}"\\)`));
  }
  assert.match(cardSource, /categoryDataAttribute\?\.\("title"\)/);
  assert.match(cardSource, /<Link href=\{postHref\}>\{post\.title\}<\/Link>/);
  assert.match(querySource, /category->\{_id, title, slug\}/);
  assert.match(cardSource, /stegaClean\(categoryReference\?\.slug\?\.current\)/);

  const latestArticlesSource = readFileSync(
    new URL("../components/blocks/latest-articles.tsx", import.meta.url),
    "utf8",
  );
  const articleCardSource = latestArticlesSource.slice(
    latestArticlesSource.indexOf("function ArticleCard"),
    latestArticlesSource.indexOf("function SectionLink"),
  );
  assert.match(latestArticlesSource, /stegaClean\(slug\)/);
  assert.match(latestArticlesSource, /postPath\(cleanSlug\)/);
  assert.match(latestArticlesSource, /categoryPath\(cleanSlug\)/);
  assert.match(articleCardSource, /return \(\s*<article/);
  assert.doesNotMatch(articleCardSource, /return \(\s*<Link\s/);
});

test("accepts only pagination route segments greater than one", () => {
  assert.equal(parseBlogPageSegment("2"), 2);
  assert.equal(parseBlogPageSegment("12"), 12);
  for (const value of ["1", "0", "-1", "1.5", "two", "02", "", undefined]) {
    assert.equal(parseBlogPageSegment(value), undefined);
  }
});

test("rejects page one aliases and pages beyond the regular-list total", () => {
  assert.equal(isBlogPageOutOfRange(1, 0), false);
  assert.equal(isBlogPageOutOfRange(2, 0), true);
  assert.equal(isBlogPageOutOfRange(5, 5), false);
  assert.equal(isBlogPageOutOfRange(6, 5), true);
});

test("builds canonical pagination and category paths", () => {
  assert.equal(getBlogPaginationUrl(1), "/blog");
  assert.equal(getBlogPaginationUrl(2), "/blog/2");
  assert.equal(getBlogCanonicalPath(1), "/blog");
  assert.equal(getBlogCanonicalPath(3), "/blog/3");
  assert.equal(getBlogPaginationUrl(1, "/blog/category/news/"), "/blog/category/news");
  assert.equal(getBlogPaginationUrl(2, "/blog/category/news/"), "/blog/category/news/2");
  assert.equal(getCategoryArchivePath("news"), "/blog/category/news");
});

test("keeps category static generation non-empty before archive copy or pagination exists", () => {
  assert.deepEqual(getCategoryStaticParams([]), [{ slug: "__missing-category__" }]);
  assert.deepEqual(getCategoryStaticParams([{ slug: "tutorials" }]), [{ slug: "tutorials" }]);
  assert.deepEqual(getCategoryPaginatedStaticParams([]), [{ page: "2", slug: "__missing-category__" }]);
  assert.deepEqual(
    getCategoryPaginatedStaticParams([{ slug: "tutorials", publishedPostCount: 12 }]),
    [{ page: "2", slug: "tutorials" }],
  );
  assert.deepEqual(
    getCategoryPaginatedStaticParams([{ slug: "tutorials", publishedPostCount: 13 }]),
    [{ page: "2", slug: "tutorials" }],
  );
  assert.deepEqual(
    getCategoryStaticParams([{ slug: "/tutorials" }, { slug: "2" }]),
    [{ slug: "__missing-category__" }],
  );
});

test("uses one category indexability rule for post count, description, and noindex", () => {
  assert.equal(
    isIndexableCategory({
      description: "Useful archive introduction",
      metaNoindex: false,
      publishedPostCount: 1,
    }),
    true,
  );
  for (const input of [
    { description: "Useful archive introduction", metaNoindex: false, publishedPostCount: 0 },
    { description: "   ", metaNoindex: false, publishedPostCount: 1 },
    { description: "Useful archive introduction", metaNoindex: true, publishedPostCount: 1 },
  ]) {
    assert.equal(isIndexableCategory(input), false);
  }
});

test("makes metadata titles unique after page one", () => {
  assert.equal(getBlogPageTitle("Insights", 1), "Insights");
  assert.equal(getBlogPageTitle("Insights", 2), "Insights - Page 2");
});

test("reports result counts for the regular collection only", () => {
  assert.equal(getBlogResultsLabel(1, 12, 57), "Showing 1–12 of 57 posts");
  assert.equal(getBlogResultsLabel(5, 9, 57), "Showing 49–57 of 57 posts");
  assert.equal(getBlogResultsLabel(1, 0, 0), "No posts");
});

test("the first blog page shows a clear one-post archive empty state", () => {
  const source = readFileSync(
    new URL("../app/(main)/blog/_components/blog-index-route.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /const hasRegularPosts = regularPosts\.length > 0/);
  assert.match(source, /hasRegularPosts \?/);
  assert.match(source, /No more posts yet\./);
});
