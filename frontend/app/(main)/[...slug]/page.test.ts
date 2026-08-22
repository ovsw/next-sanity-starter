import { beforeEach, describe, expect, it, vi } from "vitest";

const sanityFetchMetadata = vi.hoisted(() => vi.fn());
const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);

vi.mock("@/components/root-content", () => ({ RootContentView: vi.fn() }));
vi.mock("@/components/post-sidebar/model", () => ({
  getBlogPostSidebar: vi.fn(),
}));
vi.mock("@/lib/routes", () => ({ contentPath: vi.fn() }));
vi.mock("@/sanity/lib/fetch", () => ({
  fetchBlogPostSettings: vi.fn(),
  fetchSanityPageBySlug: vi.fn(),
  fetchSanityPostBySlug: vi.fn(),
  PAGES_SLUGS_QUERY: "pages",
  POSTS_SLUGS_QUERY: "posts",
}));
vi.mock("@/sanity/lib/live", () => ({
  getDynamicFetchOptions: vi.fn(),
  sanityFetchMetadata,
  sanityFetchStaticParams: vi.fn(),
}));
vi.mock("@/sanity/lib/metadata", () => ({
  generatePageMetadata: vi.fn(),
}));
vi.mock("@/sanity/queries/page", () => ({ PAGE_QUERY: "page" }));
vi.mock("@/sanity/queries/post", () => ({ POST_QUERY: "post" }));
vi.mock("next/headers", () => ({ draftMode: vi.fn() }));
vi.mock("next/navigation", () => ({ notFound }));

import { generateMetadata } from "./page";

describe("root content metadata", () => {
  beforeEach(() => {
    sanityFetchMetadata.mockReset();
    notFound.mockClear();
  });

  it("does not turn a draft-only route into a 404", async () => {
    sanityFetchMetadata.mockResolvedValue({ data: null });

    await expect(
      generateMetadata({ params: Promise.resolve({ slug: ["draft-post"] }) }),
    ).resolves.toEqual({});
    expect(notFound).not.toHaveBeenCalled();
  });
});
