import { BlogIndexRoute } from "../_components/blog-index-route";
import { calculateBlogPagination, parseBlogPageSegment } from "@/lib/blog-index";
import {
  getDynamicFetchOptions,
  sanityFetchMetadata,
  sanityFetchStaticParams,
} from "@/sanity/lib/live";
import { generateBlogIndexMetadata } from "@/sanity/lib/metadata";
import {
  BLOG_INDEX_QUERY,
  ELIGIBLE_BLOG_POSTS_COUNT_QUERY,
} from "@/sanity/queries/blog-index";
import type { BLOG_INDEX_QUERY_RESULT } from "@/sanity.types";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ page: string }> };

export const instant = false;

export async function generateStaticParams() {
  const { data } = await sanityFetchStaticParams({
    query: ELIGIBLE_BLOG_POSTS_COUNT_QUERY,
  });
  const regularPostCount = Math.max(Number(data) - 1, 0);
  const { totalPages } = calculateBlogPagination(regularPostCount, 1);

  return Array.from({ length: Math.max(totalPages - 1, 0) }, (_, index) => ({
    page: String(index + 2),
  }));
}

export async function generateMetadata({ params }: Props) {
  const { page: segment } = await params;
  const page = parseBlogPageSegment(segment);
  if (!page) notFound();
  const { data: blogIndex } = (await sanityFetchMetadata({
    query: BLOG_INDEX_QUERY,
    perspective: "published",
  })) as { data: BLOG_INDEX_QUERY_RESULT };
  return generateBlogIndexMetadata({ blogIndex, page });
}

export default async function PaginatedBlogPage({ params }: Props) {
  const [{ page: segment }, { isEnabled }] = await Promise.all([params, draftMode()]);
  const page = parseBlogPageSegment(segment);
  if (!page) notFound();
  if (isEnabled) {
    return <DynamicPaginatedBlogPage page={page} />;
  }
  return <BlogIndexRoute currentPage={page} perspective="published" stega={false} />;
}

async function DynamicPaginatedBlogPage({ page }: { page: number }) {
  const options = await getDynamicFetchOptions();
  return <BlogIndexRoute currentPage={page} {...options} />;
}
