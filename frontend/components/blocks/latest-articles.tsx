import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import Image from "next/image";
import Link from "next/link";
import { contentPath } from "@/lib/routes";

type LatestArticlesProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "latestArticles" }
>;

type Article = NonNullable<LatestArticlesProps["articles"]>[number];
type ArticleImage = LatestArticlesProps["fallbackImage"];

function getArticleHref(slug?: string | null) {
  const cleanSlug = stegaClean(slug);
  return cleanSlug ? contentPath(cleanSlug) : "#";
}

function getCategoryHref(slug?: string | null) {
  const cleanSlug = stegaClean(slug);
  return cleanSlug ? `/blog/category/${cleanSlug}/` : undefined;
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
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card border border-border bg-card text-card-foreground shadow-sm transition-[box-shadow,translate] motion-base hover:-translate-y-1 hover:shadow-interactive-lift focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:[--focus-ring-keep:var(--shadow-interactive-lift)]">
      <Link
        aria-label={`Read post: ${stegaClean(title)}`}
        className="absolute inset-0 z-0"
        href={getArticleHref(article.slug)}
      />
      <div className="pointer-events-none relative aspect-[16/10] overflow-hidden bg-muted">
        {image?.asset?._id ? (
          <Image
            alt={image.alt || stegaClean(title)}
            blurDataURL={image.asset.metadata?.lqip || undefined}
            className="rounded-none object-cover transition-transform motion-slow group-hover:scale-[1.02]"
            fill
            placeholder={image.asset.metadata?.lqip ? "blur" : undefined}
            sizes="(min-width: 1024px) 30vw, (min-width: 768px) 50vw, 100vw"
            src={urlFor(image).width(720).height(450).url()}
          />
        ) : null}
        {categoryLabel && categoryHref ? (
          <Link className="pointer-events-auto absolute left-3.5 top-3.5 z-10 rounded-full bg-foreground/80 px-2.5 py-1.5 typo-meta-label text-white no-underline backdrop-blur-sm" href={categoryHref}>
            {categoryLabel}
          </Link>
        ) : null}
      </div>
      <div className="pointer-events-none relative z-10 flex flex-1 flex-col gap-3 p-(--space-card)">
        {publishedDate ? (
          <time
            className="typo-meta-label text-muted-foreground"
            dateTime={stegaClean(article.publishedAt) || undefined}
          >
            {publishedDate}
          </time>
        ) : null}
        <h3 className="text-balance typo-card-title text-card-foreground">
          {title}
        </h3>
        {article.description ? (
          <p className="line-clamp-3 flex-1 typo-body-sm text-muted-foreground">
            {article.description}
          </p>
        ) : null}
        <span className="mt-1 typo-button text-primary transition-colors motion-fast group-hover:text-accent-hover">
          Read post <span aria-hidden="true">&rarr;</span>
        </span>
      </div>
    </article>
  );
}

function SectionLink({ button }: Readonly<{ button?: NonNullable<LatestArticlesProps["buttons"]>[number] }>) {
  const href = stegaClean(button?.href);
  if (!href || !button?.text) return null;

  return (
    <Link
      className="typo-button text-primary transition-colors motion-fast hover:text-accent-hover focus-underline"
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
  useCreamBackground,
}: LatestArticlesProps) {
  if (!articles?.length) return null;

  return (
    <section
      className={cn(
        "scroll-mt-24 section-pad",
        stegaClean(useCreamBackground) ? "surface-cream" : "surface-white",
      )}
      id="educational-content"
    >
      <div className="container">
        <div className="flex flex-wrap items-end justify-between gap-8 section-header-gap lg:gap-12">
          <div className="max-w-3xl">
            {eyebrow ? (
              <p className="mb-3.5 typo-eyebrow text-primary">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className="text-balance typo-section-heading text-foreground">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-5 max-w-2xl typo-body-editorial text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <SectionLink button={buttons?.[0]} />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.slice(0, 6).map((article) => (
            <ArticleCard article={article} fallbackImage={fallbackImage} key={article._id} />
          ))}
        </div>
      </div>
    </section>
  );
}
