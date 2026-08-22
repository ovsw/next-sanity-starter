import { describe, expect, it } from "vitest";
import {
  createBlogPostingJsonLd,
  serializeBlogPostingJsonLd,
  type BlogPostingJsonLdPost,
} from "./blog-posting-json-ld";

type PostImage = NonNullable<BlogPostingJsonLdPost["image"]>;
type PostMeta = NonNullable<BlogPostingJsonLdPost["meta"]>;

function image(url: string | null): PostImage {
  return {
    _type: "image",
    asset: {
      _id: "image-1",
      url,
      mimeType: "image/jpeg",
      metadata: null,
    },
  };
}

function meta(
  description: string | null,
  metaImage: PostImage | null,
): PostMeta {
  return {
    title: null,
    description,
    noindex: null,
    image: metaImage,
  };
}

function post(
  overrides: Partial<BlogPostingJsonLdPost> = {},
): BlogPostingJsonLdPost {
  return {
    title: "  VA Home Loan Guide  ",
    excerpt: "  A practical guide for Arizona veterans.  ",
    image: image("https://cdn.sanity.io/images/post.jpg"),
    publishedAt: "2025-04-01T12:00:00.000Z",
    _updatedAt: "2025-04-03T15:30:00.000Z",
    slug: { _type: "slug", current: "/va-home-loan-guide/" },
    meta: meta(
      "Meta description",
      image("https://cdn.sanity.io/images/meta.jpg"),
    ),
    ...overrides,
  };
}

describe("createBlogPostingJsonLd", () => {
  it("builds a complete BlogPosting referencing the Person entity by @id only", () => {
    expect(
      createBlogPostingJsonLd(post(), "https://phxhomeloan.com/"),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: "VA Home Loan Guide",
      description: "A practical guide for Arizona veterans.",
      image: "https://cdn.sanity.io/images/post.jpg",
      datePublished: "2025-04-01T12:00:00.000Z",
      dateModified: "2025-04-03T15:30:00.000Z",
      url: "https://phxhomeloan.com/va-home-loan-guide/",
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": "https://phxhomeloan.com/va-home-loan-guide/",
      },
      author: {
        "@type": "Person",
        "@id": "https://phxhomeloan.com/#jimmy",
      },
    });
  });

  it("falls back to the meta description and omits it when both are empty", () => {
    const fallback = createBlogPostingJsonLd(
      post({ excerpt: "", meta: meta("  Meta fallback.  ", null) }),
      "https://phxhomeloan.com",
    );
    const omitted = createBlogPostingJsonLd(
      post({ excerpt: "  ", meta: meta(null, null) }),
      "https://phxhomeloan.com",
    );

    expect(fallback).toHaveProperty("description", "Meta fallback.");
    expect(omitted).not.toHaveProperty("description");
  });

  it("falls back to the meta image and omits it when both are missing", () => {
    const fallback = createBlogPostingJsonLd(
      post({
        image: null,
        meta: meta(null, image("https://cdn.sanity.io/images/fallback.jpg")),
      }),
      "https://phxhomeloan.com",
    );
    const omitted = createBlogPostingJsonLd(
      post({ image: null, meta: meta(null, null) }),
      "https://phxhomeloan.com",
    );

    expect(fallback).toHaveProperty(
      "image",
      "https://cdn.sanity.io/images/fallback.jpg",
    );
    expect(omitted).not.toHaveProperty("image");
  });

  it.each([
    ["title", post({ title: null })],
    ["empty title", post({ title: "  " })],
    ["publishedAt", post({ publishedAt: null })],
    ["slug", post({ slug: null })],
  ])("returns null when %s is missing", (_field, input) => {
    expect(
      createBlogPostingJsonLd(input, "https://phxhomeloan.com"),
    ).toBeNull();
  });

  it.each(["", "   ", "/", "///", " / / "])(
    "returns null for an unusable slug (%j)",
    (current) => {
      expect(
        createBlogPostingJsonLd(
          post({ slug: { _type: "slug", current } }),
          "https://phxhomeloan.com",
        ),
      ).toBeNull();
    },
  );

  it("strips stega characters from strings", () => {
    const stega = "\u200b\u200c\u200d\ufeff";
    const value = createBlogPostingJsonLd(
      post({
        title: `Clean title${stega}`,
        excerpt: `Clean description${stega}`,
      }),
      "https://phxhomeloan.com",
    );

    expect(value).toMatchObject({
      headline: "Clean title",
      description: "Clean description",
    });
  });

  it("omits dateModified when it predates datePublished", () => {
    const value = createBlogPostingJsonLd(
      post({
        publishedAt: "2025-04-03T15:30:00.000Z",
        _updatedAt: "2025-04-01T12:00:00.000Z",
      }),
      "https://phxhomeloan.com",
    );

    expect(value).not.toHaveProperty("dateModified");
  });
});

describe("serializeBlogPostingJsonLd", () => {
  it("escapes < and round-trips as valid JSON", () => {
    const value = createBlogPostingJsonLd(
      post({ title: "Loans <fast>" }),
      "https://phxhomeloan.com",
    );
    expect(value).not.toBeNull();
    if (!value) return;

    const serialized = serializeBlogPostingJsonLd(value);
    expect(serialized).not.toContain("<");
    expect(serialized).toContain("Loans \\u003cfast>");
    expect(JSON.parse(serialized)).toEqual(value);
  });
});
