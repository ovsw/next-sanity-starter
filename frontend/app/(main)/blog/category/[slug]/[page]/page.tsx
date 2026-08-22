import { CategoryArchiveRoute } from "../../_components/category-archive-route";
import {
  getCategoryPaginatedStaticParams,
  parseBlogPageSegment,
} from "@/lib/blog-index";
import {
  getDynamicFetchOptions,
  sanityFetchMetadata,
  sanityFetchStaticParams,
} from "@/sanity/lib/live";
import { generateCategoryMetadata } from "@/sanity/lib/metadata";
import {
  CATEGORY_STATIC_PARAMS_QUERY,
  CATEGORY_QUERY,
  type CategoryArchive,
  type CategoryStaticParam,
} from "@/sanity/queries/category";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ page: string; slug: string }> };

export const instant = false;

export async function generateStaticParams() {
  const { data } = await sanityFetchStaticParams({
    query: CATEGORY_STATIC_PARAMS_QUERY,
  });
  return getCategoryPaginatedStaticParams(data as unknown as CategoryStaticParam[]);
}

export async function generateMetadata({ params }: Props) {
  const { page: segment, slug } = await params;
  const page = parseBlogPageSegment(segment);
  if (!page) notFound();
  const { data: category } = (await sanityFetchMetadata({
    query: CATEGORY_QUERY,
    params: { slug },
    perspective: "published",
  })) as { data: CategoryArchive | null };
  if (!category) notFound();
  return generateCategoryMetadata({ category, page });
}

export default async function PaginatedCategoryPage({ params }: Props) {
  const [{ page: segment, slug }, { isEnabled }] = await Promise.all([params, draftMode()]);
  const page = parseBlogPageSegment(segment);
  if (!page) notFound();
  if (isEnabled) return <DynamicPaginatedCategoryPage page={page} slug={slug} />;
  return <CategoryArchiveRoute currentPage={page} perspective="published" slug={slug} stega={false} />;
}

async function DynamicPaginatedCategoryPage({
  page,
  slug,
}: {
  page: number;
  slug: string;
}) {
  const options = await getDynamicFetchOptions();
  return <CategoryArchiveRoute currentPage={page} slug={slug} {...options} />;
}
