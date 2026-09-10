// Shadcnblocks blogpost1: centered post header, author row, and cover image.
import { documentDataAttribute, PublicationDate } from "@/components/blog-card";
import { urlFor } from "@/sanity/lib/image";
import type { POST_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import Image from "next/image";
import Link from "next/link";
import { categoryPath } from "@/lib/routes";

type PostHeroProps = {
  post: NonNullable<POST_QUERY_RESULT>;
  readTime: string;
  stega: boolean;
};

function getInitials(value: string | null | undefined) {
  const name = stegaClean(value)?.trim();
  if (!name) return "A";

  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function PostHero({ post, readTime, stega }: PostHeroProps) {
  const { author, category, excerpt, image, publishedAt, title } = post;
  const categorySlug = stegaClean(category?.slug?.current)?.replace(
    /^\/+|\/+$/g,
    "",
  );
  const categoryHref = categoryPath(categorySlug);
  const authorName = stegaClean(author?.name)?.trim();
  const postDataAttribute = documentDataAttribute({
    id: post._id,
    stega,
    type: "post",
  });
  const authorDataAttribute = author
    ? documentDataAttribute({ id: author._id, stega, type: "author" })
    : undefined;
  const categoryDataAttribute = category
    ? documentDataAttribute({ id: category._id, stega, type: "category" })
    : undefined;

  return (
    <div className="container">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center">
        <header className="flex flex-col items-center gap-4">
          {category?.title && categoryHref ? (
            <Link
              data-sanity={categoryDataAttribute?.("title")}
              href={categoryHref}
            >
              {category.title}
            </Link>
          ) : null}
          {title ? (
            <h1
              className="max-w-3xl text-5xl font-semibold text-pretty md:text-6xl"
              data-sanity={postDataAttribute?.("title")}
            >
              {title}
            </h1>
          ) : null}
          {excerpt ? (
            <p
              className="max-w-3xl text-lg text-muted-foreground md:text-xl"
              data-sanity={postDataAttribute?.("excerpt")}
            >
              {excerpt}
            </p>
          ) : null}
          <div className="flex flex-col items-center gap-2 text-sm md:flex-row md:gap-4">
            {author ? (
              <p className="flex items-center gap-2">
                {author.image?.asset?._id ? (
                  <span data-sanity={authorDataAttribute?.("image")}>
                    <Image
                      alt={
                        stegaClean(author.image.alt) ||
                        authorName ||
                        "Post author"
                      }
                      blurDataURL={
                        author.image.asset.metadata?.lqip || undefined
                      }
                      className="rounded-full border object-cover"
                      height={40}
                      placeholder={
                        author.image.asset.metadata?.lqip ? "blur" : undefined
                      }
                      sizes="40px"
                      src={urlFor(author.image)
                        .width(80)
                        .height(80)
                        .quality(100)
                        .url()}
                      width={40}
                    />
                  </span>
                ) : (
                  <span
                    aria-hidden="true"
                    data-sanity={authorDataAttribute?.("image")}
                  >
                    {getInitials(author.name)}
                  </span>
                )}
                {author.name ? (
                  <span data-sanity={authorDataAttribute?.("name")}>
                    {author.name}
                  </span>
                ) : null}
              </p>
            ) : null}
            <p className="flex items-center gap-2">
              <PublicationDate
                dataAttribute={postDataAttribute}
                value={publishedAt}
              />
              {publishedAt ? <span aria-hidden="true">•</span> : null}
              <span>{readTime}</span>
            </p>
          </div>
        </header>
        {image?.asset?._id ? (
          <figure
            className="mt-4 mb-8 w-full"
            data-sanity={postDataAttribute?.("image")}
          >
            <Image
              alt={stegaClean(image.alt) || ""}
              blurDataURL={image.asset.metadata?.lqip || undefined}
              height={image.asset.metadata?.dimensions?.height ?? 900}
              placeholder={image.asset.metadata?.lqip ? "blur" : undefined}
              className="aspect-video w-full rounded-lg border object-cover"
              sizes="(min-width: 1280px) 1024px, calc(100vw - 3rem)"
              src={urlFor(image).quality(100).url()}
              width={image.asset.metadata?.dimensions?.width ?? 1600}
            />
          </figure>
        ) : null}
      </div>
    </div>
  );
}
