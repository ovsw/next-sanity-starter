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
  const category = (article as Article & {
    category?: { slug?: { current?: string | null } | null; title?: string | null } | null;
  }).category;
  const categoryLabel = stegaClean(category?.title);
  const categoryHref = getCategoryHref(category?.slug?.current);
  const publishedDate = formatPublishedDate(article.publishedAt);
  const title = article.title || "Untitled article";

  return (
    <article>
      <div>
        {image?.asset?._id ? (
          <Image
            alt={image.alt || stegaClean(title)}
            blurDataURL={image.asset.metadata?.lqip || undefined}
            height={750}
            placeholder={image.asset.metadata?.lqip ? "blur" : undefined}
            sizes="100vw"
            src={urlFor(image).width(1200).height(750).url()}
            width={1200}
          />
        ) : null}
        {categoryLabel && categoryHref ? (
          <Link href={categoryHref}>
            {categoryLabel}
          </Link>
        ) : null}
      </div>
      <div>
        {publishedDate ? (
          <time
            dateTime={stegaClean(article.publishedAt) || undefined}
          >
            {publishedDate}
          </time>
        ) : null}
        <h3>
          <Link href={getArticleHref(article.slug)}>{title}</Link>
        </h3>
        {article.description ? (
          <p>
            {article.description}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function SectionLink({ button }: Readonly<{ button?: NonNullable<LatestArticlesProps["buttons"]>[number] }>) {
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
    <section id="latest-posts">
      <header>
        {eyebrow ? <p>{eyebrow}</p> : null}
        {title ? <h2>{title}</h2> : null}
        {description ? <p>{description}</p> : null}
        <SectionLink button={buttons?.[0]} />
      </header>
      <div>
        {articles.slice(0, 6).map((article) => (
          <ArticleCard article={article} fallbackImage={fallbackImage} key={article._id} />
        ))}
      </div>
    </section>
  );
}
