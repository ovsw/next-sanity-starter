import {
  documentDataAttribute,
  PublicationDate,
} from "@/components/blog-card";
import { urlFor } from "@/sanity/lib/image";
import type { POST_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import Image from "next/image";
import Link from "next/link";

type PostHeroProps = {
  post: NonNullable<POST_QUERY_RESULT>;
  readTime: string;
  stega: boolean;
};

function getInitials(value: string | null | undefined) {
  const name = stegaClean(value)?.trim();
  if (!name) return "PH";

  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function PostHero({ post, readTime, stega }: PostHeroProps) {
  const { author, category, excerpt, image, publishedAt, title } = post;
  const categorySlug = stegaClean(category?.slug?.current)?.replace(/^\/+|\/+$/g, "");
  const authorName = stegaClean(author?.name)?.trim();
  const postDataAttribute = documentDataAttribute({ id: post._id, stega, type: "post" });
  const authorDataAttribute = author
    ? documentDataAttribute({ id: author._id, stega, type: "author" })
    : undefined;
  const categoryDataAttribute = category
    ? documentDataAttribute({ id: category._id, stega, type: "category" })
    : undefined;

  return (
    <>
      <header className="mx-auto max-w-4xl text-center">
        {category?.title && categorySlug ? (
          <Link
            className="inline-flex rounded-full bg-primary/10 px-3 py-1.5 typo-meta-label text-primary transition-colors motion-fast hover:bg-primary/15 focus-underline"
            data-sanity={categoryDataAttribute?.("title")}
            href={`/blog/category/${categorySlug}/`}
          >
            {category.title}
          </Link>
        ) : null}
        {title ? (
          <h1
            className="mt-6 text-balance typo-display text-foreground"
            data-sanity={postDataAttribute?.("title")}
          >
            {title}
          </h1>
        ) : null}
        {excerpt ? (
          <p
            className="mx-auto mt-5 max-w-3xl text-pretty typo-lead text-muted-foreground"
            data-sanity={postDataAttribute?.("excerpt")}
          >
            {excerpt}
          </p>
        ) : null}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
          {author ? (
            <div className="flex items-center gap-2.5">
              {author.image?.asset?._id ? (
                <span data-sanity={authorDataAttribute?.("image")}>
                  <Image
                    alt={stegaClean(author.image.alt) || authorName || "Post author"}
                    blurDataURL={author.image.asset.metadata?.lqip || undefined}
                    className="size-10 rounded-full object-cover"
                    height={40}
                    placeholder={author.image.asset.metadata?.lqip ? "blur" : undefined}
                    quality={100}
                    sizes="40px"
                    src={urlFor(author.image).width(80).height(80).quality(100).url()}
                    width={40}
                  />
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                  data-sanity={authorDataAttribute?.("image")}
                >
                  {getInitials(author.name)}
                </span>
              )}
              {author.name ? (
                <span
                  className="font-semibold text-foreground"
                  data-sanity={authorDataAttribute?.("name")}
                >
                  {author.name}
                </span>
              ) : null}
            </div>
          ) : null}
          <div className="flex items-center gap-3">
            <PublicationDate dataAttribute={postDataAttribute} value={publishedAt} />
            {publishedAt ? <span aria-hidden="true">•</span> : null}
            <span className="typo-meta-label">{readTime}</span>
          </div>
        </div>
      </header>
      {image?.asset?._id ? (
        <div
          className="relative mt-12 aspect-[16/9] overflow-hidden rounded-frame border border-border/80 bg-muted shadow-sm"
          data-sanity={postDataAttribute?.("image")}
        >
          <Image
            alt={stegaClean(image.alt) || ""}
            blurDataURL={image.asset.metadata?.lqip || undefined}
            className="object-cover"
            fill
            placeholder={image.asset.metadata?.lqip ? "blur" : undefined}
            quality={100}
            sizes="(min-width: 1280px) 1280px, calc(100vw - 2rem)"
            src={urlFor(image).quality(100).url()}
          />
        </div>
      ) : null}
    </>
  );
}
