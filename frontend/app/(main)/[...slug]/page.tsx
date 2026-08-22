import { RootContentView } from "@/components/root-content";
import {
  fetchSanityPageBySlug,
  fetchSanityPostBySlug,
  fetchBlogPostSettings,
  PAGES_SLUGS_QUERY,
  POSTS_SLUGS_QUERY,
} from "@/sanity/lib/fetch";
import { getBlogPostSidebar } from "@/components/post-sidebar/model";
import {
  getDynamicFetchOptions,
  sanityFetchMetadata,
  sanityFetchStaticParams,
  type DynamicFetchOptions,
} from "@/sanity/lib/live";
import { generatePageMetadata } from "@/sanity/lib/metadata";
import { contentPath } from "@/lib/routes";
import { PAGE_QUERY } from "@/sanity/queries/page";
import { POST_QUERY } from "@/sanity/queries/post";
import type {
  PAGE_QUERY_RESULT,
  PAGES_SLUGS_QUERY_RESULT,
  POST_QUERY_RESULT,
  POSTS_SLUGS_QUERY_RESULT,
} from "@/sanity.types";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";

export const instant = false;

function resolveRootContent(
  page: PAGE_QUERY_RESULT,
  post: POST_QUERY_RESULT,
  slug: string,
) {
  if (page && post) {
    throw new Error(`Root route collision for /${slug}/`);
  }
  return page || post || null;
}

export async function generateStaticParams() {
  const [{ data: pages }, { data: posts }] = await Promise.all([
    sanityFetchStaticParams({ query: PAGES_SLUGS_QUERY }) as Promise<{
      data: PAGES_SLUGS_QUERY_RESULT;
    }>,
    sanityFetchStaticParams({ query: POSTS_SLUGS_QUERY }) as Promise<{
      data: POSTS_SLUGS_QUERY_RESULT;
    }>,
  ]);

  const slugs = [
    ...pages.map((page) => page.slug?.current),
    ...posts.map((post) => post.slug?.current),
  ];

  return slugs.flatMap((value) => {
    const slug = value?.replace(/^\/+|\/+$/g, "");
    if (!slug) return [];
    return [{ slug: slug.split("/").filter(Boolean) }];
  });
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await props.params;
  const slugPath = slug.join("/");
  const [{ data: page }, { data: post }] = await Promise.all([
    sanityFetchMetadata({
      query: PAGE_QUERY,
      params: { slug: slugPath },
      perspective: "published",
    }) as Promise<{ data: PAGE_QUERY_RESULT }>,
    sanityFetchMetadata({
      query: POST_QUERY,
      params: { slug: slugPath },
      perspective: "published",
    }) as Promise<{ data: POST_QUERY_RESULT }>,
  ]);
  const content = resolveRootContent(page, post, slugPath);
  // The page renderer owns 404s. Metadata only sees published content, so a
  // 404 here would prevent draft-only routes from reaching Presentation.
  if (!content) return {};

  return generatePageMetadata({ page: content, path: contentPath(slugPath) });
}

export default async function RootContentPage(props: {
  params: Promise<{ slug: string[] }>;
}) {
  const { isEnabled: isDraftMode } = await draftMode();

  if (isDraftMode) {
    return <DynamicRootContent params={props.params} />;
  }

  const { slug } = await props.params;
  return (
    <CachedRootContent
      slug={slug.join("/")}
      perspective="published"
      stega={false}
    />
  );
}

async function DynamicRootContent({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const [{ slug }, { perspective, stega }] = await Promise.all([
    params,
    getDynamicFetchOptions(),
  ]);

  return (
    <CachedRootContent
      slug={slug.join("/")}
      perspective={perspective}
      stega={stega}
    />
  );
}

async function CachedRootContent({
  slug,
  perspective,
  stega,
}: { slug: string } & DynamicFetchOptions) {
  const [page, post, blogPostSettings] = await Promise.all([
    fetchSanityPageBySlug({ slug, perspective, stega }),
    fetchSanityPostBySlug({ slug, perspective, stega }),
    fetchBlogPostSettings({ perspective, stega }).catch(() => null),
  ]);
  const content = resolveRootContent(page, post, slug);
  if (!content) notFound();

  return (
    <RootContentView
      blogPostSidebar={getBlogPostSidebar(blogPostSettings)}
      content={content}
      perspective={perspective}
      stega={stega}
    />
  );
}
