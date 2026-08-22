import { stegaClean } from "next-sanity";
import { contentPath } from "@/lib/routes";
import type { POST_QUERY_RESULT } from "@/sanity.types";

export type BlogPostingJsonLdPost = Pick<
  NonNullable<POST_QUERY_RESULT>,
  | "title"
  | "excerpt"
  | "image"
  | "publishedAt"
  | "_updatedAt"
  | "slug"
  | "meta"
>;

export type BlogPostingJsonLd = {
  "@context": "https://schema.org";
  "@type": "BlogPosting";
  headline: string;
  description?: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  url: string;
  mainEntityOfPage: {
    "@type": "WebPage";
    "@id": string;
  };
  author: {
    "@type": "Person";
    "@id": string;
  };
};

// Builds one BlogPosting from the post data already fetched for the page. The
// author is a bare reference to the site-wide Person entity. Returns null
// instead of emitting invalid schema when a required field is missing.
export function createBlogPostingJsonLd(
  post: BlogPostingJsonLdPost,
  siteUrl: string,
): BlogPostingJsonLd | null {
  const headline = stegaClean(post.title)?.trim();
  const slug = stegaClean(post.slug?.current)
    ?.trim()
    .replace(/^\/+|\/+$/g, "")
    .trim();
  if (!headline || !post.publishedAt || !slug) return null;

  const description =
    stegaClean(post.excerpt)?.trim() ||
    stegaClean(post.meta?.description)?.trim();
  const image =
    post.image?.asset?.url || post.meta?.image?.asset?.url || undefined;
  const dateModified =
    Date.parse(post._updatedAt) >= Date.parse(post.publishedAt)
      ? post._updatedAt
      : undefined;
  const normalizedSiteUrl = siteUrl.replace(/\/$/, "");
  const url = `${normalizedSiteUrl}${contentPath(slug)}`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline,
    ...(description ? { description } : {}),
    ...(image ? { image } : {}),
    datePublished: post.publishedAt,
    ...(dateModified ? { dateModified } : {}),
    url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    author: {
      "@type": "Person",
      "@id": `${normalizedSiteUrl}/#jimmy`,
    },
  };
}

export function serializeBlogPostingJsonLd(value: BlogPostingJsonLd) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
