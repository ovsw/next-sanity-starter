import { createDataAttribute, stegaClean } from "next-sanity";
import Blocks from "@/components/blocks";
import BlogPostingJsonLd from "@/components/blog-posting-json-ld";
import FaqPageJsonLd from "@/components/faq-json-ld";
import LoanJsonLd from "@/components/loan-json-ld";
import VideoJsonLd from "@/components/video-json-ld";
import { siteUrl } from "@/lib/site-url";
import QuickNav from "@/components/quick-nav";
import { createQuickNavModel } from "@/lib/quick-nav";
import PostHero from "@/components/blocks/post-hero";
import {
  createPostBodyModel,
  getPostReadTime,
  type BlogPostSidebar,
} from "@/components/post-sidebar/model";
import {
  PostSidebar,
  PostTableOfContentsRail,
} from "@/components/post-sidebar/post-sidebar";
import { cn } from "@/lib/utils";
import { documentDataAttribute } from "@/components/blog-card";
import RichTextContent from "@/components/rich-text-content";
import { dataset, projectId } from "@/sanity/lib/env";
import type { DynamicFetchOptions } from "@/sanity/lib/live";
import type { PAGE_QUERY_RESULT, POST_QUERY_RESULT } from "@/sanity.types";

function PageContent({
  page,
  perspective,
  stega,
}: {
  page: NonNullable<PAGE_QUERY_RESULT>;
  perspective: DynamicFetchOptions["perspective"];
  stega: boolean;
}) {
  const blocks = page.blocks ?? [];
  const quickNav = createQuickNavModel(blocks, page.showQuickNav !== false);
  const heroBlocks = blocks.slice(0, quickNav.heroCount);
  const contentBlocks = blocks.slice(quickNav.heroCount);
  const isRichTextOnlyPage =
    blocks.length > 0 && blocks.every((block) => block._type === "richTextBlock");
  const rootDataAttribute = stega
    ? (path: "description" | "title") =>
        createDataAttribute({
          baseUrl: process.env.NEXT_PUBLIC_STUDIO_URL || "http://localhost:3333",
          dataset,
          id: page._id,
          path,
          projectId,
          type: "page",
        }).toString()
    : undefined;

  return (
    <>
      <FaqPageJsonLd blocks={blocks} />
      <LoanJsonLd
        loanType={page.loanType}
        metaDescription={page.meta?.description}
        pageDescription={page.description}
        siteUrl={siteUrl}
        slug={page.slug}
      />
      <VideoJsonLd blocks={blocks} siteUrl={siteUrl} />
      {isRichTextOnlyPage && stegaClean(page.title)?.trim() ? (
        <header className="surface-white border-b border-border py-14 md:py-20">
          <div className="container">
            <div className="max-w-4xl">
              <h1
                className="text-balance text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-foreground"
                data-sanity={rootDataAttribute?.("title")}
              >
                {page.title}
              </h1>
              {stegaClean(page.description)?.trim() ? (
                <p
                  className="mt-5 max-w-3xl text-pretty text-lg leading-8 text-muted-foreground md:text-xl"
                  data-sanity={rootDataAttribute?.("description")}
                >
                  {page.description}
                </p>
              ) : null}
            </div>
          </div>
        </header>
      ) : null}
      {heroBlocks.length > 0 ? (
        <Blocks
          blocks={heroBlocks}
          documentId={page._id}
          perspective={perspective}
          stega={stega}
        />
      ) : null}
      {quickNav.showQuickNav ? <QuickNav items={quickNav.items} /> : null}
      <Blocks
        anchorIds={quickNav.anchorIdByKey}
        blocks={contentBlocks}
        documentId={page._id}
        perspective={perspective}
        stega={stega}
      />
    </>
  );
}

function PostContent({
  blogPostSidebar,
  post,
  stega,
}: {
  blogPostSidebar: BlogPostSidebar | null;
  post: NonNullable<POST_QUERY_RESULT>;
  stega: boolean;
}) {
  const body = post.body ?? [];
  const bodyModel = createPostBodyModel(body);
  const hasPostSidebar = Boolean(blogPostSidebar?.actions?.length);
  const hasTableOfContents = bodyModel.showTableOfContents;
  const layoutClassName = hasTableOfContents
    ? hasPostSidebar
      ? "lg:grid-cols-[15rem_minmax(0,1fr)_17rem]"
      : "lg:grid-cols-[15rem_minmax(0,48rem)] lg:justify-center"
    : hasPostSidebar
      ? "lg:grid-cols-[minmax(0,48rem)_20rem] lg:justify-center"
      : "lg:grid-cols-[minmax(0,48rem)] lg:justify-center";
  const layoutName = hasTableOfContents
    ? hasPostSidebar
      ? "three-column"
      : "toc-column"
    : hasPostSidebar
      ? "two-column"
      : "single-column";
  const readTime = getPostReadTime(body);
  const blogPostSettingsDataAttribute = blogPostSidebar
    ? documentDataAttribute({
        id: blogPostSidebar._id,
        stega,
        type: blogPostSidebar._type,
      })
    : undefined;
  const bodyDataAttribute = stega
    ? createDataAttribute({
        baseUrl: process.env.NEXT_PUBLIC_STUDIO_URL || "http://localhost:3333",
        dataset,
        id: post._id,
        path: "body",
        projectId,
        type: "post",
      }).toString()
    : undefined;

  return (
    <section className="surface-cream">
      <BlogPostingJsonLd post={post} siteUrl={siteUrl} />
      <VideoJsonLd blocks={[]} postBody={body} siteUrl={siteUrl} />
      <div className="container py-16 md:py-24">
        <PostHero post={post} readTime={readTime} stega={stega} />
        <div
          className={cn(
            "mt-12 grid grid-cols-1 gap-10 lg:mt-16 lg:gap-12",
            layoutClassName,
          )}
          data-post-layout={layoutName}
        >
          {bodyModel.showTableOfContents ? (
            <PostTableOfContentsRail headings={bodyModel.headings} />
          ) : null}
          <article className="min-w-0">
            {body.length ? (
              <RichTextContent
                dataSanity={bodyDataAttribute}
                getHeadingId={bodyModel.getHeadingId}
                value={body}
              />
            ) : null}
          </article>
          <PostSidebar
            dataAttribute={blogPostSettingsDataAttribute}
            sidebar={blogPostSidebar}
          />
        </div>
      </div>
    </section>
  );
}

export function RootContentView({
  blogPostSidebar = null,
  content,
  perspective,
  stega,
}: {
  blogPostSidebar?: BlogPostSidebar | null;
  content: NonNullable<PAGE_QUERY_RESULT | POST_QUERY_RESULT>;
  perspective: DynamicFetchOptions["perspective"];
  stega: boolean;
}) {
  return content._type === "post" ? (
    <PostContent blogPostSidebar={blogPostSidebar} post={content} stega={stega} />
  ) : (
    <PageContent page={content} perspective={perspective} stega={stega} />
  );
}
