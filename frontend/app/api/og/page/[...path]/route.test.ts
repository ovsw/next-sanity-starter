import { sharingCardPhotoUrl } from "@/sanity/lib/image";
import { buildPageOgImageUrl } from "@/lib/page-og-image";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeState = vi.hoisted(() => ({
  renderFails: false,
  props: {} as Record<string, unknown>,
}));
const sanityFetchMetadata = vi.hoisted(() => vi.fn());

vi.mock("@/sanity/lib/live", () => ({ sanityFetchMetadata }));
vi.mock("node:fs/promises", async (importOriginal) => ({
  ...(await importOriginal<typeof import("node:fs/promises")>()),
  readFile: vi.fn(async () => Buffer.from("asset")),
}));
vi.mock("@/components/post-og-image", () => ({
  PostOgImage: vi.fn(() => null),
}));
vi.mock("next/og", () => ({
  ImageResponse: function MockImageResponse(
    _element: { props: Record<string, unknown> },
    options: { headers?: HeadersInit },
  ) {
    routeState.props = _element.props;
    if (routeState.renderFails) throw new Error("render failed");
    return new Response("png", { headers: options.headers, status: 200 });
  },
}));

import { GET } from "./route";

const title = "Straightforward Guidance";

function signedUrl(photoUrl?: string) {
  return buildPageOgImageUrl({
    photoUrl,
    origin: "https://example.test",
    secret: "test-only-og-image-secret",
    target: { kind: "home" },
    title,
  });
}

function get(url: string) {
  return GET(new Request(url), { params: Promise.resolve({ path: ["home"] }) });
}

describe("page OG image route", () => {
  beforeEach(() => {
    routeState.renderFails = false;
    sanityFetchMetadata.mockReset();
    sanityFetchMetadata.mockResolvedValue({ data: { title } });
  });

  it("renders a logo-on-colour card when there is no photo", async () => {
    expect((await get(signedUrl())).status).toBe(200);
    expect(routeState.props.photoUrl).toBeUndefined();
    expect(routeState.props.logo).toMatch(/^data:image\/svg\+xml;base64,/);
    expect(routeState.props.mark).toMatch(/^data:image\/svg\+xml;base64,/);
    expect(routeState.props.title).toBe(title);
  });

  it("renders the selected photo and rejects its stale revision", async () => {
    const sharingPhoto = {
      asset: { _ref: "image-abc123-1200x630-jpg", _type: "reference" },
    };
    const photoUrl = sharingCardPhotoUrl(sharingPhoto);
    sanityFetchMetadata.mockResolvedValue({ data: { title, sharingPhoto } });
    expect((await get(signedUrl(photoUrl))).status).toBe(200);
    expect(routeState.props.photoUrl).toBe(photoUrl);
    expect((await get(signedUrl())).status).toBe(404);
  });

  it("rejects bad signatures and extra inputs before fetching Sanity", async () => {
    const badSignature = new URL(signedUrl());
    badSignature.searchParams.set("sig", "invalid");
    const extraInput = new URL(signedUrl());
    extraInput.searchParams.set("title", "attacker controlled");

    expect((await get(badSignature.toString())).status).toBe(404);
    expect((await get(extraInput.toString())).status).toBe(404);
    expect(sanityFetchMetadata).not.toHaveBeenCalled();
  });

  it("fetches published content and returns immutable browser and CDN caching", async () => {
    const response = await get(signedUrl());

    expect(response.status).toBe(200);
    expect(sanityFetchMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ perspective: "published" }),
    );
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(response.headers.get("vercel-cdn-cache-control")).toBe(
      "public, max-age=31536000, immutable",
    );
  });

  it("keeps the SEO override out of the visible card headline", async () => {
    sanityFetchMetadata.mockResolvedValueOnce({
      data: {
        overrideTitle: "Home | The Highly Motivated Vercellino Team",
        title,
      },
    });

    expect((await get(signedUrl())).status).toBe(200);
  });

  it("rejects stale, missing, or unpublished page content", async () => {
    sanityFetchMetadata.mockResolvedValueOnce({ data: { title: "Changed" } });
    expect((await get(signedUrl())).status).toBe(404);

    sanityFetchMetadata.mockResolvedValueOnce({ data: null });
    expect((await get(signedUrl())).status).toBe(404);
  });

  it("redirects render failures to the default branded card", async () => {
    routeState.renderFails = true;
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const response = await get(signedUrl());

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://example.test/api/og/default",
    );
    consoleError.mockRestore();
  });
});
