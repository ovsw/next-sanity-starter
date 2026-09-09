import type {
  BLOG_INDEX_QUERY_RESULT,
  HOME_PAGE_QUERY_RESULT,
  PAGE_QUERY_RESULT,
  POST_QUERY_RESULT,
} from "@/sanity.types";
import type { CategoryArchive } from "@/sanity/queries/category";
import { describe, expect, it } from "vitest";
import { verifyPostOgImageSignature } from "@/lib/post-og-image";
import { verifyOgImageSignature } from "@/lib/post-og-image";
import {
  generateBlogIndexMetadata,
  generateCategoryMetadata,
  generatePageMetadata,
} from "./metadata";

const post = {
  _id: "post-1",
  _type: "post",
  _updatedAt: "2026-08-15T12:00:00Z",
  publishedAt: "2026-08-10T12:00:00Z",
  slug: { _type: "slug", current: "market-trends" },
  title: "Why Market Trends Change",
  meta: {
    title: "Market trends",
    description: "A practical method rate explanation.",
    image: null,
    noindex: false,
  },
} as unknown as NonNullable<POST_QUERY_RESULT>;

const page = {
  _id: "page-1",
  _type: "page",
  _updatedAt: "2026-08-15T12:00:00Z",
  slug: "about",
  title: "About",
  meta: {
    title: "About | About Example Company",
    description: "About Example Company.",
    image: null,
    noindex: false,
  },
} as unknown as NonNullable<PAGE_QUERY_RESULT>;

const homePage = {
  _id: "homePage",
  _type: "homePage",
  title: "Home",
  meta: {
    title: "Example Knowledge Base | Example Company",
    description: "A practical resource library.",
    noindex: false,
  },
} as unknown as NonNullable<HOME_PAGE_QUERY_RESULT>;

const blogIndex = {
  _id: "blogIndex",
  _type: "blogIndex",
  title: "Insights Blog",
  description: "Practical method guidance.",
  meta: {
    title: "Method Advice | Example Company",
    description: "Practical method guidance.",
    image: null,
    noindex: false,
  },
} as unknown as NonNullable<BLOG_INDEX_QUERY_RESULT>;

const category = {
  _id: "category-1",
  _type: "category",
  title: "Categories",
  slug: { current: "categories" },
  description: "Compare service options.",
  publishedPostCount: 4,
  meta: {
    title: "Resource Guides | Example Company",
    description: "Compare service options.",
    image: null,
    noindex: false,
  },
} satisfies CategoryArchive;

describe("generatePageMetadata", () => {
  it("uses one signed generated card for post Open Graph and Twitter metadata", () => {
    const metadata = generatePageMetadata({ page: post, path: "/blog/market-trends" });
    const image = metadata.openGraph.images[0];
    const url = new URL(image.url);

    expect(metadata.openGraph.type).toBe("article");
    expect(metadata.title).toBe("Market trends");
    expect(metadata.openGraph.title).toBe(
      "Market trends | Example Company",
    );
    expect(metadata.openGraph).toHaveProperty(
      "publishedTime",
      post.publishedAt,
    );
    expect(image).toMatchObject({
      width: 1200,
      height: 630,
      alt: `${post.title} | Example Company`,
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Market trends | Example Company",
      images: [image],
    });
    expect(
      verifyPostOgImageSignature({
        identity: {
          slug: "market-trends",
          revision: url.searchParams.get("rev") || "",
          version: url.searchParams.get("v") || "",
        },
        secret: process.env.OG_IMAGE_SECRET || "",
        signature: url.searchParams.get("sig") || "",
      }),
    ).toBe(true);
  });

  it("uses a signed generated card for ordinary page Open Graph and Twitter metadata", () => {
    const metadata = generatePageMetadata({ page, path: "/about" });
    const image = metadata.openGraph.images[0];
    const url = new URL(image.url);

    expect(metadata.openGraph).toMatchObject({
      title: "About | About Example Company",
      type: "website",
      images: [
        { width: 1200, height: 630, alt: "About | About Example Company" },
      ],
    });
    expect(url.pathname).toBe("/api/og/page/page/about");
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "About | About Example Company",
      images: [image],
    });
    expect(
      verifyOgImageSignature({
        identity: {
          key: "page:about",
          revision: url.searchParams.get("rev") || "",
          version: url.searchParams.get("v") || "",
        },
        secret: process.env.OG_IMAGE_SECRET || "",
        signature: url.searchParams.get("sig") || "",
      }),
    ).toBe(true);
    expect(metadata.title).toEqual({
      absolute: "About | About Example Company",
    });
  });

  it("falls back to the content title when the override is missing", () => {
    const pageWithoutOverride = {
      ...page,
      meta: { ...page.meta, title: null },
    } as NonNullable<PAGE_QUERY_RESULT>;
    const metadata = generatePageMetadata({
      page: pageWithoutOverride,
      path: "/about/",
    });

    expect(metadata.title).toBe("About");
    expect(metadata.openGraph.title).toBe(
      "About | Example Company",
    );
  });

  it("prefers an editor-selected sharing image for Open Graph and Twitter", () => {
    const pageWithImage = {
      ...page,
      meta: {
        ...page.meta,
        image: {
          asset: {
            url: "https://cdn.sanity.io/images/project/production/social.jpg",
            metadata: { dimensions: { width: 1600, height: 900 } },
          },
        },
      },
    } as unknown as NonNullable<PAGE_QUERY_RESULT>;

    const metadata = generatePageMetadata({ page: pageWithImage, path: "/about" });
    const image = {
      url: "https://cdn.sanity.io/images/project/production/social.jpg",
      width: 1600,
      height: 900,
      alt: "About | About Example Company",
    };

    expect(metadata.openGraph.images).toEqual([image]);
    expect(metadata.twitter.images).toEqual([image]);
  });

  it("uses one absolute, branded homepage title", () => {
    const metadata = generatePageMetadata({ page: homePage, path: "/" });

    expect(metadata.title).toEqual({
      absolute: "Example Knowledge Base | Example Company",
    });
    expect(metadata.openGraph.title).toBe(
      "Example Knowledge Base | Example Company",
    );
    expect(metadata.twitter.title).toBe(
      "Example Knowledge Base | Example Company",
    );
    expect(metadata.openGraph.images[0].alt).toBe(
      "Example Knowledge Base | Example Company",
    );
  });
});

describe("generateBlogIndexMetadata", () => {
  it("derives a unique branded title for pagination", () => {
    const metadata = generateBlogIndexMetadata({ blogIndex, page: 2 });
    const title = "Method Advice | Example Company - Page 2";

    expect(metadata.title).toEqual({ absolute: title });
    expect(metadata.openGraph.title).toBe(title);
    expect(metadata.openGraph.images[0].alt).toBe(title);
    expect(metadata.twitter.title).toBe(title);
  });
});

describe("generateCategoryMetadata", () => {
  it.each([
    [1, "Resource Guides | Example Company"],
    [2, "Resource Guides | Example Company - Page 2"],
  ])("derives the category title for page %i", (pageNumber, pageTitle) => {
    const metadata = generateCategoryMetadata({ category, page: pageNumber });

    expect(metadata.title).toEqual({ absolute: pageTitle });
    expect(metadata.openGraph.title).toBe(pageTitle);
    expect(metadata.openGraph.images[0].alt).toBe(pageTitle);
    expect(metadata.twitter.title).toBe(pageTitle);
  });
});
