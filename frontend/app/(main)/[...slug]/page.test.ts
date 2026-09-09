import { beforeEach, describe, expect, it, vi } from "vitest";

const sanityFetchMetadata = vi.hoisted(() => vi.fn());
const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);

vi.mock("@/components/root-content", () => ({ RootContentView: vi.fn() }));
vi.mock("@/sanity/lib/fetch", () => ({
  fetchSanityPageBySlug: vi.fn(),
  PAGES_SLUGS_QUERY: "pages",
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
vi.mock("next/headers", () => ({ draftMode: vi.fn() }));
vi.mock("next/navigation", () => ({ notFound }));

import { generateMetadata, generateStaticParams } from "./page";
import { sanityFetchStaticParams } from "@/sanity/lib/live";

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

  it("loads nested page metadata with the complete slug", async () => {
    sanityFetchMetadata.mockResolvedValue({ data: null });
    await generateMetadata({ params: Promise.resolve({ slug: ["about", "team"] }) });
    expect(sanityFetchMetadata).toHaveBeenCalledWith(expect.objectContaining({
      params: { slug: "about/team" },
    }));
  });

  it.each([["blog", "post"], ["api", "test"], ["about", "Bad"], ["about", ""]])(
    "rejects reserved or malformed page segments %s/%s",
    async (...slug) => {
      await expect(generateMetadata({ params: Promise.resolve({ slug }) })).resolves.toEqual({});
      expect(sanityFetchMetadata).not.toHaveBeenCalled();
    },
  );

  it("splits nested static params and excludes reserved routes", async () => {
    vi.mocked(sanityFetchStaticParams).mockResolvedValue({ data: [
      { slug: { current: "/about/team/" } },
      { slug: { current: "blog/post" } },
      { slug: { current: "bad//slug" } },
      { slug: { current: "contact" } },
    ] });
    await expect(generateStaticParams()).resolves.toEqual([
      { slug: ["about", "team"] },
      { slug: ["contact"] },
    ]);
  });
});
