import { RegularPostCard, documentDataAttribute } from "@/components/blog-card";
import BlogPagination from "@/components/blog-pagination";
import {
  calculateBlogPagination,
  getBlogPostWindow,
  getBlogResultsLabel,
  getCategoryArchivePath,
  isBlogPageOutOfRange,
} from "@/lib/blog-index";
import ParticleField from "@/components/particle-field";
import {
  fetchCategory,
  fetchCategoryPosts,
  fetchCategoryPostsCount,
} from "@/sanity/lib/fetch";
import type { DynamicFetchOptions } from "@/sanity/lib/live";
import { notFound } from "next/navigation";
import { stegaClean } from "next-sanity";
import Link from "next/link";

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

  return (
    <main className="bg-background">
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
          <nav aria-label="Breadcrumb" className="mb-[1.375rem] flex items-center gap-2.5 text-[0.8125rem] font-medium text-white/55">
            <Link className="text-white/65 no-underline hover:text-white" href="/">Home</Link>
            <span aria-hidden="true" className="opacity-50">/</span>
            <Link className="text-white/65 no-underline hover:text-white" href="/blog/">Blog</Link>
            <span aria-hidden="true" className="opacity-50">/</span>
            <span className="text-xs font-semibold uppercase leading-none tracking-[0.24em] text-label-on-dark">{title}</span>
          </nav>
          <h1 className="max-w-[51.25rem] text-balance text-[2.5rem] font-semibold leading-[1.08] text-white md:text-[3.75rem]" data-sanity={fieldDataAttribute?.("title")}>
            {category.title}
          </h1>
          {description?.trim() ? (
            <p className="mt-5 max-w-[38.75rem] text-pretty text-lg leading-[1.65] text-white/70" data-sanity={fieldDataAttribute?.("description")}>
              {category.description}
            </p>
          ) : null}
        </div>
      </header>

      <section className="surface-cream px-4 pb-[6.5rem] pt-12 md:px-10 md:pt-14 lg:pt-16">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-[2.125rem] flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-[clamp(1.625rem,2.4vw,2rem)] font-semibold leading-[1.15] text-card-foreground">Posts in {title}</h2>
            <p className="text-sm font-medium text-muted-foreground">
              {getBlogResultsLabel(currentPage, posts.length, postCount)}
            </p>
          </div>
          {posts.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => <RegularPostCard key={post._id} post={post} stega={stega} />)}
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground">No posts yet</p>
          )}
          <BlogPagination basePath={basePath} pagination={pagination} />
        </div>
      </section>
    </main>
  );
}
