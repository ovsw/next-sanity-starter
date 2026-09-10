import { PostCard } from "@/components/shadcnblocks/post-card";
import { categoryPath, postPath } from "@/lib/routes";
import { dataset, projectId } from "@/sanity/lib/env";
import { urlFor } from "@/sanity/lib/image";
import type { BlogPost } from "@/sanity/queries/blog-index";
import { createDataAttribute, stegaClean } from "next-sanity";
import Image from "next/image";
import Link from "next/link";

type DataAttribute = (path: string) => string | undefined;

function BlogImage({
  dataAttribute,
  post,
}: {
  dataAttribute?: DataAttribute;
  post: BlogPost;
}) {
  if (!post.image?.asset?._id) return null;
  return (
    <figure data-sanity={dataAttribute?.("image")}>
      <Image
        alt={stegaClean(post.image.alt) || ""}
        blurDataURL={post.image.asset.metadata?.lqip || undefined}
        height={post.image.asset.metadata?.dimensions?.height ?? 900}
        placeholder={post.image.asset.metadata?.lqip ? "blur" : undefined}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        src={urlFor(post.image).width(1200).fit("max").url()}
        width={post.image.asset.metadata?.dimensions?.width ?? 1600}
      />
    </figure>
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

export function LatestPostCard({
  post,
  stega,
}: {
  post: BlogPost;
  stega: boolean;
}) {
  const slug = stegaClean(post.slug?.current);
  if (!slug) return null;
  const postHref = postPath(slug);
  if (!postHref) return null;
  const category = post.category;
  const categoryLabel = stegaClean(category?.title);
  const categorySlug = stegaClean(category?.slug?.current);
  const categoryHref = categoryPath(categorySlug);
  const dataAttribute = documentDataAttribute({
    id: post._id,
    stega,
    type: "post",
  });
  const categoryDataAttribute = category
    ? documentDataAttribute({ id: category._id, stega, type: "category" })
    : undefined;
  return (
    <PostCard
      href={postHref}
      title={post.title}
      description={post.excerpt}
      image={<BlogImage dataAttribute={dataAttribute} post={post} />}
      titleAttribute={dataAttribute?.("title")}
      descriptionAttribute={dataAttribute?.("excerpt")}
      date={
        <PublicationDate
          dataAttribute={dataAttribute}
          value={post.publishedAt}
        />
      }
      category={
        categoryLabel && categoryHref ? (
          <Link
            data-sanity={categoryDataAttribute?.("title")}
            href={categoryHref}
          >
            {categoryLabel}
          </Link>
        ) : null
      }
    />
  );
}

// The archive and latest sections use the same blog1 card.
export const RegularPostCard = LatestPostCard;
