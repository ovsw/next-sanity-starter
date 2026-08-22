import {
  BLOG_INDEX_QUERY_RESULT,
  HOME_PAGE_QUERY_RESULT,
  PAGE_QUERY_RESULT,
  POST_QUERY_RESULT,
} from "@/sanity.types";
import {
  getCategoryArchivePath,
  getBlogCanonicalPath,
  getBlogPageDescription,
  getBlogPageTitle,
  isIndexableCategory,
} from "@/lib/blog-index";
import type { CategoryArchive } from "@/sanity/queries/category";
import { buildPostOgImageUrl, isValidOgSlug } from "@/lib/post-og-image";
import { siteName } from "@/lib/site-name";
import {
  buildPageOgImageUrl,
  getPageOgImageTitle,
  type PageOgImageTarget,
} from "@/lib/page-og-image";
import { resolveSeoTitle } from "../../../shared/seo-title";
const isProduction = process.env.NEXT_PUBLIC_SITE_ENV === "production";

const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function sharingImage(url: string, title: string, alt = `${title} | ${siteName}`) {
  return {
    url,
    width: 1200,
    height: 630,
    alt,
  };
}

function fallbackSharingImage() {
  return sharingImage(
    `${siteOrigin}/images/og-post-fallback.png`,
    "Helpful website content",
  );
}

function resolveArchiveTitles({
  contentTitle,
  fallbackTitle,
  overrideTitle,
  page,
}: {
  contentTitle?: string | null;
  fallbackTitle: string;
  overrideTitle?: string | null;
  page: number;
}) {
  const baseTitleResolution = resolveSeoTitle({
    fallbackTitle: contentTitle || fallbackTitle,
    overrideTitle,
    siteName,
  });
  const pageTitleResolution = resolveSeoTitle({
    fallbackTitle: getBlogPageTitle(baseTitleResolution.pageTitle, page),
    ...(overrideTitle?.includes("|")
      ? { overrideTitle: getBlogPageTitle(baseTitleResolution.finalTitle, page) }
      : {}),
    siteName,
  });
  const cardTitle = getBlogPageTitle(
    getPageOgImageTitle(contentTitle || overrideTitle || fallbackTitle),
    page,
  );

  return { cardTitle, pageTitleResolution };
}

export function generatePageMetadata({
  page,
  path,
}: {
  page: HOME_PAGE_QUERY_RESULT | PAGE_QUERY_RESULT | POST_QUERY_RESULT;
  path: string;
}) {
  const isPost = page?._type === "post";
  const isHomepage = page?._type === "homePage";
  const seoTitle = resolveSeoTitle({
    fallbackTitle: page?.title,
    isHomepage,
    overrideTitle: page?.meta?.title,
    siteName,
  });
  const postTitle = isPost ? page.title?.trim() : undefined;
  // Slugs the signed OG routes cannot represent fall through to the generic
  // sharing image instead of turning the page request into a server error.
  const postImage =
    isPost && postTitle && page.publishedAt && isValidOgSlug(page.slug?.current || "")
      ? buildPostOgImageUrl({
          origin: siteOrigin,
          publishedAt: page.publishedAt,
          slug: page.slug?.current || "",
          title: postTitle,
        })
      : null;
  const rawPageTitle =
    isHomepage
      ? page.title || seoTitle.pageTitle
      : page?._type === "page"
        ? page.title || page.meta?.title
        : undefined;
  const pageTitle = rawPageTitle
    ? getPageOgImageTitle(rawPageTitle)
    : undefined;
  const pageSlug = path.replace(/^\/+|\/+$/g, "");
  const pageTarget: PageOgImageTarget | null =
    page?._type === "homePage"
      ? { kind: "home" }
      : page?._type === "page" && path !== "/" && isValidOgSlug(pageSlug)
        ? { kind: "page", slug: pageSlug }
        : null;
  const pageImage =
    pageTitle && pageTarget
      ? buildPageOgImageUrl({
          origin: siteOrigin,
          target: pageTarget,
          title: pageTitle,
        })
      : null;
  // The generated card uses the visible content title. Its alt text uses the
  // final social title, including any complete suffix supplied by the editor.
  const image = postImage && postTitle
    ? sharingImage(postImage, postTitle)
    : pageImage && pageTitle
      ? sharingImage(pageImage, pageTitle, seoTitle.finalTitle)
      : fallbackSharingImage();

  return {
    title: seoTitle.metadataTitle,
    description: page?.meta?.description,
    openGraph: {
      title: seoTitle.openGraphTitle,
      images: [image],
      locale: "en_US",
      type: isPost ? "article" : "website",
      ...(isPost && page.publishedAt
        ? { publishedTime: page.publishedAt }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle.twitterTitle,
      images: [image],
    },
    robots: !isProduction
      ? "noindex, nofollow"
      : page?.meta?.noindex
        ? "noindex"
        : "index, follow",
    alternates: {
      canonical: process.env.NEXT_PUBLIC_SITE_URL + path,
    },
  };
}

export function generateBlogIndexMetadata({
  blogIndex,
  page,
}: {
  blogIndex: BLOG_INDEX_QUERY_RESULT;
  page: number;
}) {
  const { cardTitle, pageTitleResolution } = resolveArchiveTitles({
    contentTitle: blogIndex?.title,
    fallbackTitle: "Blog",
    overrideTitle: blogIndex?.meta?.title,
    page,
  });
  const description =
    blogIndex?.meta?.description || blogIndex?.description || undefined;
  const image = sharingImage(
    buildPageOgImageUrl({
      origin: siteOrigin,
      target: { kind: "blog", page },
      title: cardTitle,
    }),
    cardTitle,
    pageTitleResolution.finalTitle,
  );

  return {
    title: pageTitleResolution.metadataTitle,
    description: getBlogPageDescription(description, page),
    openGraph: {
      title: pageTitleResolution.openGraphTitle,
      images: [image],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitleResolution.twitterTitle,
      images: [image],
    },
    robots: !isProduction
      ? "noindex, nofollow"
      : blogIndex?.meta?.noindex
        ? "noindex"
        : "index, follow",
    alternates: {
      canonical:
        process.env.NEXT_PUBLIC_SITE_URL + getBlogCanonicalPath(page),
    },
  };
}

export function generateCategoryMetadata({
  category,
  page,
}: {
  category: CategoryArchive;
  page: number;
}) {
  const { cardTitle, pageTitleResolution } = resolveArchiveTitles({
    contentTitle: category.title,
    fallbackTitle: "Blog category",
    overrideTitle: category.meta?.title,
    page,
  });
  const description = category.meta?.description || category.description || undefined;
  const slug = category.slug?.current || "";
  const image =
    isValidOgSlug(slug) && !slug.includes("/")
      ? sharingImage(
          buildPageOgImageUrl({
            origin: siteOrigin,
            target: { kind: "category", page, slug },
            title: cardTitle,
          }),
          cardTitle,
          pageTitleResolution.finalTitle,
        )
      : fallbackSharingImage();
  const isIndexable = isIndexableCategory({
    description: category.description,
    metaNoindex: category.meta?.noindex,
    publishedPostCount: category.publishedPostCount,
  });

  return {
    title: pageTitleResolution.metadataTitle,
    description: getBlogPageDescription(description, page),
    openGraph: {
      title: pageTitleResolution.openGraphTitle,
      images: [image],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitleResolution.twitterTitle,
      images: [image],
    },
    robots: !isProduction
      ? "noindex, nofollow"
      : isIndexable
        ? "index, follow"
        : "noindex, follow",
    alternates: {
      canonical:
        process.env.NEXT_PUBLIC_SITE_URL +
        getBlogCanonicalPath(page, getCategoryArchivePath(slug)),
    },
  };
}
