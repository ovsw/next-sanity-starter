import { PostCard } from "@/components/shadcnblocks/post-card";
import { urlFor } from "@/sanity/lib/image";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import Image from "next/image";
import Link from "next/link";
import { categoryPath, postPath } from "@/lib/routes";

type LatestArticlesProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "latestArticles" }
>;

type Article = NonNullable<LatestArticlesProps["articles"]>[number];
type ArticleImage = LatestArticlesProps["fallbackImage"];

function getArticleHref(slug?: string | null) {
  const cleanSlug = stegaClean(slug);
  return cleanSlug ? (postPath(cleanSlug) ?? "#") : "#";
}

function getCategoryHref(slug?: string | null) {
  const cleanSlug = stegaClean(slug);
  return cleanSlug ? (categoryPath(cleanSlug) ?? undefined) : undefined;
}

function formatPublishedDate(publishedAt?: string | null) {
  const cleanPublishedAt = stegaClean(publishedAt);
  if (!cleanPublishedAt) return null;

  const date = new Date(cleanPublishedAt);
  if (Number.isNaN(date.getTime())) return null;

  return date
    .toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
      year: "numeric",
    })
    .toUpperCase();
}

function ArticleCard({
  article,
  fallbackImage,
}: Readonly<{ article: Article; fallbackImage?: ArticleImage }>) {
  const image = article.image?.asset?._id ? article.image : fallbackImage;
  const category = article.category;
  const categoryLabel = stegaClean(category?.title);
  const categoryHref = getCategoryHref(category?.slug?.current);
  const publishedDate = formatPublishedDate(article.publishedAt);
  const title = article.title || "Untitled article";

  return (
    <PostCard
      title={title}
      href={getArticleHref(article.slug)}
      description={article.description}
      image={
        image?.asset?._id ? (
          <Image
            alt={image.alt || stegaClean(title)}
            width={1200}
            height={800}
            sizes="(min-width: 1024px) 33vw, 100vw"
            src={urlFor(image).width(1200).height(800).url()}
          />
        ) : null
      }
      category={
        categoryLabel && categoryHref ? (
          <Link href={categoryHref}>{categoryLabel}</Link>
        ) : null
      }
      date={
        publishedDate ? (
          <time dateTime={stegaClean(article.publishedAt) || undefined}>
            {publishedDate}
          </time>
        ) : null
      }
    />
  );
}

function SectionLink({
  button,
}: Readonly<{ button?: NonNullable<LatestArticlesProps["buttons"]>[number] }>) {
  const href = stegaClean(button?.href);
  if (!href || !button?.text) return null;

  return (
    <Link
      href={href}
      rel={stegaClean(button.openInNewTab) ? "noopener noreferrer" : undefined}
      target={stegaClean(button.openInNewTab) ? "_blank" : undefined}
    >
      {button.text} <span aria-hidden="true">&rarr;</span>
    </Link>
  );
}

export default function LatestArticles({
  articles,
  buttons,
  description,
  eyebrow,
  fallbackImage,
  title,
}: LatestArticlesProps) {
  if (!articles?.length) return null;

  return (
    <section className="container py-32" id="latest-posts">
      <header className="mb-12 space-y-4">
        {eyebrow ? <p>{eyebrow}</p> : null}
        {title ? (
          <h2 className="mb-6 text-4xl font-medium md:text-5xl">{title}</h2>
        ) : null}
        {description ? <p>{description}</p> : null}
        <SectionLink button={buttons?.[0]} />
      </header>
      <div className="grid gap-4 md:grid-cols-2 lg:gap-6 2xl:grid-cols-3">
        {articles.slice(0, 6).map((article) => (
          <ArticleCard
            article={article}
            fallbackImage={fallbackImage}
            key={article._id}
          />
        ))}
      </div>
    </section>
  );
}
