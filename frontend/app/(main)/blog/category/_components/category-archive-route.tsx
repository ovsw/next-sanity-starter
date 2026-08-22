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
  const description = stegaClean(category.description);
  const fieldDataAttribute = documentDataAttribute({
    id: category._id,
    stega,
    type: "category",
  });
  const basePath = getCategoryArchivePath(stegaClean(category.slug?.current) || slug);
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
      <header>
        <nav aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true"> / </span>
          <Link href="/blog">Blog</Link>
          <span aria-hidden="true"> / </span>
          <span>{title}</span>
        </nav>
        <h1 data-sanity={fieldDataAttribute?.("title")}>{category.title}</h1>
        {description?.trim() ? (
          <p data-sanity={fieldDataAttribute?.("description")}>
            {category.description}
          </p>
        ) : null}
      </header>

      <section aria-labelledby="category-posts-heading">
        <h2 id="category-posts-heading">Posts in {title}</h2>
        <p>{getBlogResultsLabel(currentPage, posts.length, postCount)}</p>
        {posts.length ? (
          <div>
            {posts.map((post) => (
              <RegularPostCard key={post._id} post={post} stega={stega} />
            ))}
          </div>
        ) : (
          <p>No posts in this category yet.</p>
        )}
        <BlogPagination basePath={basePath} pagination={pagination} />
      </section>
    </>
  );
}
