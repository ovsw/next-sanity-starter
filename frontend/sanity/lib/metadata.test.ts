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
  slug: { _type: "slug", current: "mortgage-rates" },
  title: "Why Mortgage Rates Are Going Up",
  meta: {
    title: "Mortgage rates",
    description: "A practical mortgage rate explanation.",
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
    title: "About | Phoenix Mortgage Lenders",
    description: "About PHX Home Loan.",
    image: null,
    noindex: false,
  },
} as unknown as NonNullable<PAGE_QUERY_RESULT>;

const homePage = {
  _id: "homePage",
  _type: "homePage",
  title: "Home",
  meta: {
    title: "Phoenix Mortgage Lender | PHX Home Loan",
    description: "A trusted Phoenix mortgage lender.",
    noindex: false,
  },
} as unknown as NonNullable<HOME_PAGE_QUERY_RESULT>;

const blogIndex = {
  _id: "blogIndex",
  _type: "blogIndex",
  title: "Mortgage Blog",
  description: "Practical mortgage guidance.",
  meta: {
    title: "Mortgage Advice | PHX Home Loan",
    description: "Practical mortgage guidance.",
    image: null,
    noindex: false,
  },
} as unknown as NonNullable<BLOG_INDEX_QUERY_RESULT>;

const category = {
  _id: "category-1",
  _type: "category",
  title: "Loan Types",
  slug: { current: "loan-types" },
  description: "Compare home loan options.",
  publishedPostCount: 4,
  meta: {
    title: "Home Loan Guides | Mortgage Lender",
    description: "Compare home loan options.",
    image: null,
    noindex: false,
  },
} satisfies CategoryArchive;

describe("generatePageMetadata", () => {
  it("uses one signed generated card for post Open Graph and Twitter metadata", () => {
    const metadata = generatePageMetadata({ page: post, path: "/mortgage-rates/" });
    const image = metadata.openGraph.images[0];
    const url = new URL(image.url);

    expect(metadata.openGraph.type).toBe("article");
    expect(metadata.title).toBe("Mortgage rates");
    expect(metadata.openGraph.title).toBe(
      "Mortgage rates | The Vercellino Team",
    );
    expect(metadata.openGraph).toHaveProperty(
      "publishedTime",
      post.publishedAt,
    );
    expect(image).toMatchObject({
      width: 1200,
      height: 630,
      alt: `${post.title} | The Vercellino Team`,
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Mortgage rates | The Vercellino Team",
      images: [image],
    });
    expect(
      verifyPostOgImageSignature({
        identity: {
          slug: "mortgage-rates",
          revision: url.searchParams.get("rev") || "",
          version: url.searchParams.get("v") || "",
        },
        secret: process.env.OG_IMAGE_SECRET || "",
        signature: url.searchParams.get("sig") || "",
      }),
    ).toBe(true);
  });

  it("uses a signed generated card for ordinary page Open Graph and Twitter metadata", () => {
    const metadata = generatePageMetadata({ page, path: "/about/" });
    const image = metadata.openGraph.images[0];
    const url = new URL(image.url);

    expect(metadata.openGraph).toMatchObject({
      title: "About | Phoenix Mortgage Lenders",
      type: "website",
      images: [
        { width: 1200, height: 630, alt: "About | Phoenix Mortgage Lenders" },
      ],
    });
    expect(url.pathname).toBe("/api/og/page/page/about");
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "About | Phoenix Mortgage Lenders",
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
      absolute: "About | Phoenix Mortgage Lenders",
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
    expect(metadata.openGraph.title).toBe("About | The Vercellino Team");
  });

  it("uses one absolute, branded homepage title", () => {
    const metadata = generatePageMetadata({ page: homePage, path: "/" });

    expect(metadata.title).toEqual({
      absolute: "Phoenix Mortgage Lender | PHX Home Loan",
    });
    expect(metadata.openGraph.title).toBe(
      "Phoenix Mortgage Lender | PHX Home Loan",
    );
    expect(metadata.twitter.title).toBe(
      "Phoenix Mortgage Lender | PHX Home Loan",
    );
    expect(metadata.openGraph.images[0].alt).toBe(
      "Phoenix Mortgage Lender | PHX Home Loan",
    );
  });
});

describe("generateBlogIndexMetadata", () => {
  it("derives a unique branded title for pagination", () => {
    const metadata = generateBlogIndexMetadata({ blogIndex, page: 2 });
    const title = "Mortgage Advice | PHX Home Loan - Page 2";

    expect(metadata.title).toEqual({ absolute: title });
    expect(metadata.openGraph.title).toBe(title);
    expect(metadata.openGraph.images[0].alt).toBe(title);
    expect(metadata.twitter.title).toBe(title);
  });
});

describe("generateCategoryMetadata", () => {
  it.each([
    [1, "Home Loan Guides | Mortgage Lender"],
    [2, "Home Loan Guides | Mortgage Lender - Page 2"],
  ])("derives the category title for page %i", (pageNumber, pageTitle) => {
    const metadata = generateCategoryMetadata({ category, page: pageNumber });

    expect(metadata.title).toEqual({ absolute: pageTitle });
    expect(metadata.openGraph.title).toBe(pageTitle);
    expect(metadata.openGraph.images[0].alt).toBe(pageTitle);
    expect(metadata.twitter.title).toBe(pageTitle);
  });
});
