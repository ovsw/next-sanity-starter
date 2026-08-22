import { contentPath } from "@/lib/routes";
import { dataset, projectId } from "@/sanity/lib/env";
import { urlFor } from "@/sanity/lib/image";
import type { BlogPost } from "@/sanity/queries/blog-index";
import { createDataAttribute, stegaClean } from "next-sanity";
import Image from "next/image";
import Link from "next/link";

type DataAttribute = (path: string) => string | undefined;

function BlogImage({
  dataAttribute,
  featured = false,
  post,
}: {
  dataAttribute?: DataAttribute;
  featured?: boolean;
  post: BlogPost;
}) {
  if (!post.image?.asset?._id) return null;
  return (
    <div
      className={featured ? "pointer-events-none relative min-h-72 bg-muted lg:min-h-full" : "pointer-events-none relative aspect-[16/10] bg-muted"}
      data-sanity={dataAttribute?.("image")}
    >
      <Image
        alt={stegaClean(post.image.alt) || ""}
        blurDataURL={post.image.asset.metadata?.lqip || undefined}
        className="object-cover"
        fill
        placeholder={post.image.asset.metadata?.lqip ? "blur" : undefined}
        quality={100}
        sizes={featured ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
        src={urlFor(post.image).url()}
      />
    </div>
  );
}

export function PublicationDate({
  dataAttribute,
  value,
}: {
  dataAttribute?: DataAttribute;
  value: string | null;
}) {
  if (!value) return null;
  const label = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  })
    .format(new Date(stegaClean(value)))
    .toUpperCase();
  return (
    <time
      className="typo-meta-label text-muted-foreground"
      data-sanity={dataAttribute?.("publishedAt")}
      dateTime={stegaClean(value)}
    >
      {label}
    </time>
  );
}

export function documentDataAttribute({
  id,
  stega,
  type,
}: {
  id: string;
  stega: boolean;
  type: "author" | "blogPostSettings" | "category" | "post" | "settings";
}): DataAttribute | undefined {
  if (!stega) return undefined;

  return (path: string) =>
    createDataAttribute({
      baseUrl: process.env.NEXT_PUBLIC_STUDIO_URL || "http://localhost:3333",
      dataset,
      id,
      path,
      projectId,
      type,
    }).toString();
}

export function LatestPostCard({ post, stega }: { post: BlogPost; stega: boolean }) {
  const slug = stegaClean(post.slug?.current);
  if (!slug) return null;
  const category = post.category;
  const categoryLabel = stegaClean(category?.title);
  const categorySlug = stegaClean(category?.slug?.current);
  const dataAttribute = documentDataAttribute({ id: post._id, stega, type: "post" });
  const categoryDataAttribute = category
    ? documentDataAttribute({ id: category._id, stega, type: "category" })
    : undefined;
  return (
    <article className="relative grid overflow-hidden rounded-card border border-border bg-card shadow-sm lg:grid-cols-2">
      {!stega ? (
        <Link aria-label={`Read post: ${stegaClean(post.title)}`} className="absolute inset-0 z-0" href={contentPath(slug)} />
      ) : null}
      <BlogImage dataAttribute={dataAttribute} featured post={post} />
      {categoryLabel && categorySlug ? (
        <Link
          className="absolute left-3.5 top-3.5 z-10 rounded-full bg-[rgba(12,19,41,0.82)] px-3 py-1.5 typo-meta-label text-white no-underline backdrop-blur-sm lg:left-[calc(50%+0.875rem)]"
          data-sanity={categoryDataAttribute?.("title")}
          href={`/blog/category/${categorySlug}/`}
        >
          {categoryLabel}
        </Link>
      ) : null}
      <div className="pointer-events-none relative z-10 self-center p-7 md:p-9 lg:p-10">
        <PublicationDate dataAttribute={dataAttribute} value={post.publishedAt} />
        <h3
          className="mt-4 text-balance text-3xl font-semibold leading-tight text-card-foreground"
          data-sanity={dataAttribute?.("title")}
        >
          {stega ? <Link className="pointer-events-auto" href={contentPath(slug)}>{post.title}</Link> : post.title}
        </h3>
        {post.excerpt ? (
          <p
            className="mt-3 line-clamp-3 typo-body-sm text-muted-foreground"
            data-sanity={dataAttribute?.("excerpt")}
          >
            {post.excerpt}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function RegularPostCard({ post, stega }: { post: BlogPost; stega: boolean }) {
  const slug = stegaClean(post.slug?.current);
  if (!slug) return null;
  const categoryReference = post.category;
  const category = stegaClean(categoryReference?.title);
  const categorySlug = stegaClean(categoryReference?.slug?.current);
  const dataAttribute = documentDataAttribute({ id: post._id, stega, type: "post" });
  const categoryDataAttribute = categoryReference
    ? documentDataAttribute({ id: categoryReference._id, stega, type: "category" })
    : undefined;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card border border-border bg-card transition-[box-shadow,translate] motion-base hover:-translate-y-1 hover:shadow-interactive-lift dark:hover:shadow-[0_22px_48px_rgba(0,0,0,0.28)]">
      {!stega ? (
        <Link aria-label={`Read post: ${stegaClean(post.title)}`} className="absolute inset-0 z-0" href={contentPath(slug)} />
      ) : null}
      <div className="relative bg-muted">
        <BlogImage dataAttribute={dataAttribute} post={post} />
        {category && categorySlug ? (
          <Link
            className="absolute left-3.5 top-3.5 z-10 rounded-full bg-[rgba(12,19,41,0.82)] px-3 py-1.5 typo-meta-label text-white no-underline backdrop-blur-sm"
            data-sanity={categoryDataAttribute?.("title")}
            href={`/blog/category/${categorySlug}/`}
          >
            {category}
          </Link>
        ) : null}
      </div>
      <div className="pointer-events-none relative z-10 flex flex-1 flex-col gap-3 px-7 pb-7 pt-6">
        <PublicationDate dataAttribute={dataAttribute} value={post.publishedAt} />
        <h3
          className="text-balance typo-card-title text-card-foreground"
          data-sanity={dataAttribute?.("title")}
        >
          {stega ? <Link className="pointer-events-auto" href={contentPath(slug)}>{post.title}</Link> : post.title}
        </h3>
        {post.excerpt ? (
          <p
            className="line-clamp-3 typo-body-sm text-muted-foreground"
            data-sanity={dataAttribute?.("excerpt")}
          >
            {post.excerpt}
          </p>
        ) : null}
        <span className="mt-auto pt-2 typo-button text-primary">
          Read post {"\u2192"}
        </span>
      </div>
    </article>
  );
}
