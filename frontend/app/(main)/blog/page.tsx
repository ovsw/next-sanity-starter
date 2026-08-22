import { BlogIndexRoute } from "./_components/blog-index-route";
import { generateBlogIndexMetadata } from "@/sanity/lib/metadata";
import { getDynamicFetchOptions, sanityFetchMetadata } from "@/sanity/lib/live";
import { BLOG_INDEX_QUERY } from "@/sanity/queries/blog-index";
import type { BLOG_INDEX_QUERY_RESULT } from "@/sanity.types";
import { draftMode } from "next/headers";

export async function generateMetadata() {
  const { data: blogIndex } = (await sanityFetchMetadata({
    query: BLOG_INDEX_QUERY,
    perspective: "published",
  })) as { data: BLOG_INDEX_QUERY_RESULT };
  return generateBlogIndexMetadata({ blogIndex, page: 1 });
}

export default async function BlogPage() {
  const { isEnabled } = await draftMode();
  if (isEnabled) {
    return <DynamicBlogPage />;
  }
  return <BlogIndexRoute currentPage={1} perspective="published" stega={false} />;
}

async function DynamicBlogPage() {
  const options = await getDynamicFetchOptions();
  return <BlogIndexRoute currentPage={1} {...options} />;
}
