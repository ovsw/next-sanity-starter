import { PageHeading } from "@/components/shadcnblocks/page-heading";
import Blocks from "@/components/blocks";
import BreadcrumbJsonLd from "@/components/breadcrumb-json-ld";
import FaqPageJsonLd from "@/components/faq-json-ld";
import { LatestPostCard, RegularPostCard } from "@/components/blog-card";
import BlogPagination from "@/components/blog-pagination";
import {
  calculateBlogPagination,
  getRegularPostQueryParams,
  getBlogResultsLabel,
  getBlogCanonicalPath,
  isBlogPageOutOfRange,
} from "@/lib/blog-index";
import {
  fetchBlogIndex,
  fetchLatestPost,
  fetchRegularPosts,
  fetchRegularPostsCount,
} from "@/sanity/lib/fetch";
import type { DynamicFetchOptions } from "@/sanity/lib/live";
import { createDataAttribute } from "next-sanity";
import { notFound } from "next/navigation";
import { dataset, projectId } from "@/sanity/lib/env";
import Link from "next/link";
import { siteUrl } from "@/lib/site-url";

export async function BlogIndexRoute({
  currentPage,
  perspective,
  stega,
}: { currentPage: number } & DynamicFetchOptions) {
  const [blogIndex, latestPost] = await Promise.all([
    fetchBlogIndex({ perspective, stega }),
    fetchLatestPost({ perspective, stega }),
  ]);
  if (!blogIndex) notFound();

  const latestPostId = latestPost?._id || "";
  const queryParams = getRegularPostQueryParams(latestPostId, currentPage);
  const [regularPosts, regularPostCount] = latestPost
    ? await Promise.all([
        fetchRegularPosts({ ...queryParams, perspective, stega }),
        fetchRegularPostsCount({ latestPostId, perspective, stega }),
      ])
    : [[], 0];
  const pagination = calculateBlogPagination(regularPostCount, currentPage);
  if (isBlogPageOutOfRange(currentPage, pagination.totalPages)) {
    notFound();
  }
  const postsHeading =
    currentPage === 1 && latestPost ? "More posts" : "All posts";
  const emptyPostsMessage =
    currentPage === 1 && latestPost ? "No more posts yet." : "No posts yet.";
  const hasRegularPosts = regularPosts.length > 0;

  const fieldDataAttribute = stega
    ? (path: "description" | "title") =>
        createDataAttribute({
          baseUrl:
            process.env.NEXT_PUBLIC_STUDIO_URL || "http://localhost:3333",
          dataset,
          id: blogIndex._id,
          path,
          projectId,
          type: "blogIndex",
        }).toString()
    : undefined;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Blog", path: getBlogCanonicalPath(currentPage) },
        ]}
        siteUrl={siteUrl}
      />
      <FaqPageJsonLd blocks={blogIndex.blocks ?? []} />
      <PageHeading
        title={blogIndex.title}
        description={blogIndex.description}
        titleAttribute={fieldDataAttribute?.("title")}
        descriptionAttribute={fieldDataAttribute?.("description")}
      >
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span>Blog</span>
        </nav>
      </PageHeading>

      {currentPage === 1 && latestPost ? (
        <section
          className="container pb-24"
          aria-labelledby="latest-post-heading"
        >
          <h2 className="mb-6 text-3xl font-semibold" id="latest-post-heading">
            Latest post
          </h2>
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            <LatestPostCard post={latestPost} stega={stega} />
          </div>
        </section>
      ) : null}

      {(hasRegularPosts || !latestPost || currentPage > 1) && (
        <section
          className="container pb-24"
          aria-labelledby="all-posts-heading"
        >
          <h2 className="mb-6 text-3xl font-semibold" id="all-posts-heading">
            {postsHeading}
          </h2>
          <p className="mb-8 text-muted-foreground">
            {getBlogResultsLabel(
              currentPage,
              regularPosts.length,
              regularPostCount,
            )}
          </p>
          {hasRegularPosts ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:gap-6 2xl:grid-cols-3">
                {regularPosts.map((post) => (
                  <RegularPostCard key={post._id} post={post} stega={stega} />
                ))}
              </div>
              <BlogPagination pagination={pagination} />
            </>
          ) : (
            <p className="mb-8 text-muted-foreground">{emptyPostsMessage}</p>
          )}
        </section>
      )}

      <Blocks
        blocks={blogIndex.blocks ?? []}
        documentId={blogIndex._id}
        documentType="blogIndex"
        perspective={perspective}
        stega={stega}
      />
    </>
  );
}
