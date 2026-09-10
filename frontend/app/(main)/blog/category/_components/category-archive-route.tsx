import { PageHeading } from "@/components/shadcnblocks/page-heading";
import { RegularPostCard, documentDataAttribute } from "@/components/blog-card";
import BreadcrumbJsonLd from "@/components/breadcrumb-json-ld";
import BlogPagination from "@/components/blog-pagination";
import {
  calculateBlogPagination,
  getBlogPostWindow,
  getBlogResultsLabel,
  getBlogCanonicalPath,
  getCategoryArchivePath,
  isBlogPageOutOfRange,
} from "@/lib/blog-index";
import {
  fetchCategory,
  fetchCategoryPosts,
  fetchCategoryPostsCount,
} from "@/sanity/lib/fetch";
import type { DynamicFetchOptions } from "@/sanity/lib/live";
import { notFound } from "next/navigation";
import { stegaClean } from "next-sanity";
import Link from "next/link";
import { siteUrl } from "@/lib/site-url";

export async function CategoryArchiveRoute({
  currentPage,
  perspective,
  slug,
  stega,
}: { currentPage: number; slug: string } & DynamicFetchOptions) {
  const category = await fetchCategory({ perspective, slug, stega });
  if (!category) notFound();

  const [posts, postCount] = await Promise.all([
    fetchCategoryPosts({
      categoryId: category._id,
      ...getBlogPostWindow(currentPage),
      perspective,
      stega,
    }),
    fetchCategoryPostsCount({ categoryId: category._id, perspective, stega }),
  ]);
  const pagination = calculateBlogPagination(postCount, currentPage);
  if (isBlogPageOutOfRange(currentPage, pagination.totalPages)) notFound();

  const title = stegaClean(category.title) || "Blog category";
  const fieldDataAttribute = documentDataAttribute({
    id: category._id,
    stega,
    type: "category",
  });
  const basePath = getCategoryArchivePath(
    stegaClean(category.slug?.current) || slug,
  );
  const canonicalPath = getBlogCanonicalPath(currentPage, basePath);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: title, path: canonicalPath },
        ]}
        siteUrl={siteUrl}
      />
      <PageHeading
        title={title}
        description={category.description}
        titleAttribute={fieldDataAttribute?.("title")}
        descriptionAttribute={fieldDataAttribute?.("description")}
      >
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/blog">Blog</Link>
          <span aria-hidden="true">/</span>
          <span>{title}</span>
        </nav>
      </PageHeading>

      <section
        className="container pb-24"
        aria-labelledby="category-posts-heading"
      >
        <h2 className="mb-6 text-3xl font-semibold" id="category-posts-heading">
          Posts in {title}
        </h2>
        <p className="mb-8 text-muted-foreground">
          {getBlogResultsLabel(currentPage, posts.length, postCount)}
        </p>
        {posts.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:gap-6 2xl:grid-cols-3">
            {posts.map((post) => (
              <RegularPostCard key={post._id} post={post} stega={stega} />
            ))}
          </div>
        ) : (
          <p className="mb-8 text-muted-foreground">
            No posts in this category yet.
          </p>
        )}
        <BlogPagination basePath={basePath} pagination={pagination} />
      </section>
    </>
  );
}
