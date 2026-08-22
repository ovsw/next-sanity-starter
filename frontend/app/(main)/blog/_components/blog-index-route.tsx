import Blocks from "@/components/blocks";
import FaqPageJsonLd from "@/components/faq-json-ld";
import VideoJsonLd from "@/components/video-json-ld";
import { siteUrl } from "@/lib/site-url";
import { LatestPostCard, RegularPostCard } from "@/components/blog-card";
import BlogPagination from "@/components/blog-pagination";
import {
  calculateBlogPagination,
  getRegularPostQueryParams,
  getBlogResultsLabel,
  isBlogPageOutOfRange,
} from "@/lib/blog-index";
import {
  fetchBlogIndex,
  fetchLatestPost,
  fetchRegularPosts,
  fetchRegularPostsCount,
} from "@/sanity/lib/fetch";
import type { DynamicFetchOptions } from "@/sanity/lib/live";
import ParticleField from "@/components/particle-field";
import { createDataAttribute, stegaClean } from "next-sanity";
import { notFound } from "next/navigation";
import { dataset, projectId } from "@/sanity/lib/env";
import Link from "next/link";

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

  const fieldDataAttribute = stega
    ? (path: "description" | "title") =>
        createDataAttribute({
          baseUrl: process.env.NEXT_PUBLIC_STUDIO_URL || "http://localhost:3333",
          dataset,
          id: blogIndex._id,
          path,
          projectId,
          type: "blogIndex",
        }).toString()
    : undefined;

  return (
    <main className="bg-background">
      <FaqPageJsonLd blocks={blogIndex.blocks ?? []} />
      <VideoJsonLd blocks={blogIndex.blocks ?? []} siteUrl={siteUrl} />
      <header className="relative overflow-hidden bg-[var(--phx-navy-900)] py-[4.625rem] text-white md:py-[4.875rem]">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(760px 340px at 82% -10%, rgba(31,110,140,.28), transparent 68%), radial-gradient(680px 420px at 6% 118%, rgba(31,110,140,.14), transparent 70%)",
          }}
        />
        <ParticleField />
        <div className="container relative">
          <nav
            aria-label="Breadcrumb"
            className="mb-[1.375rem] flex items-center gap-2.5 text-[0.8125rem] font-medium text-white/55"
          >
            <Link className="text-white/65 no-underline hover:text-white" href="/">
              Home
            </Link>
            <span aria-hidden="true" className="opacity-50">/</span>
            <span className="text-xs font-semibold uppercase leading-none tracking-[0.24em] text-label-on-dark">
              Blog
            </span>
          </nav>
          <h1 className="max-w-[51.25rem] text-balance text-[2.5rem] font-semibold leading-[1.08] text-white md:text-[3.75rem]" data-sanity={fieldDataAttribute?.("title")}>
            {blogIndex.title}
          </h1>
          {stegaClean(blogIndex.description)?.trim() ? (
            <p className="mt-5 max-w-[38.75rem] text-pretty text-lg leading-[1.65] text-white/70" data-sanity={fieldDataAttribute?.("description")}>
              {blogIndex.description}
            </p>
          ) : null}
        </div>
      </header>

      {currentPage === 1 && latestPost ? (
        <section aria-labelledby="latest-post-heading" className="surface-cream px-4 pt-12 md:px-10 md:pt-14 lg:pt-16">
          <div className="mx-auto w-full max-w-7xl">
            <h2 className="sr-only" id="latest-post-heading">Latest post</h2>
            <LatestPostCard post={latestPost} stega={stega} />
          </div>
        </section>
      ) : null}

      <section className="surface-cream px-4 pb-[6.5rem] pt-12 md:px-10 md:pt-14 lg:pt-16">
        <div className="mx-auto w-full max-w-7xl">
          {latestPost ? (
            <>
              <div className="mb-[2.125rem] flex flex-wrap items-end justify-between gap-4">
                <h2 className="text-[clamp(1.625rem,2.4vw,2rem)] font-semibold leading-[1.15] text-card-foreground">All posts</h2>
                <p className="text-sm font-medium text-muted-foreground">
                  {getBlogResultsLabel(currentPage, regularPosts.length, regularPostCount)}
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {regularPosts.map((post) => (
                  <RegularPostCard key={post._id} post={post} stega={stega} />
                ))}
              </div>
              <BlogPagination pagination={pagination} />
            </>
          ) : (
            <p className="py-8 text-center text-muted-foreground">No posts yet</p>
          )}
        </div>
      </section>

      <Blocks
        blocks={blogIndex.blocks ?? []}
        documentId={blogIndex._id}
        documentType="blogIndex"
        perspective={perspective}
        stega={stega}
      />
    </main>
  );
}
