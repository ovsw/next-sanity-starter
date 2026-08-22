import { describe, expect, it } from "vitest";
import {
  collectYouTubeVideoIds,
  createVideoObjectJsonLd,
  serializeVideoJsonLd,
} from "./video-json-ld";
import type { YouTubeVideoMetadata } from "./youtube-metadata";

const stega = "\u200b\u200c\u200d\ufeff";

function metadata(
  overrides: Partial<YouTubeVideoMetadata> = {},
): YouTubeVideoMetadata {
  return {
    videoId: "abc123def45",
    title: "VA Loans Explained",
    description: "Everything veterans need to know.",
    publishedAt: "2025-04-01T12:00:00Z",
    thumbnailUrl: "https://i.ytimg.com/vi/abc123def45/maxresdefault.jpg",
    duration: "PT4M20S",
    ...overrides,
  };
}

describe("collectYouTubeVideoIds", () => {
  it("extracts from all four video sources", () => {
    const blocks = [
      { _type: "videoFeature", youtubeUrl: "https://youtu.be/aaaaaaaaaaa" },
      {
        _type: "bigVideoFeature",
        youtubeUrl: "https://www.youtube.com/watch?v=bbbbbbbbbbb",
      },
      {
        _type: "richTextBlock",
        richText: [{ _type: "youtube", url: "https://youtu.be/ccccccccccc" }],
      },
      {
        _type: "hero1",
        body: [{ _type: "youtube", videoId: "ddddddddddd" }],
      },
    ];

    expect(collectYouTubeVideoIds(blocks)).toEqual([
      "aaaaaaaaaaa",
      "bbbbbbbbbbb",
      "ccccccccccc",
      "ddddddddddd",
    ]);
  });

  it("dedupes the same video across URL and bare-ID forms", () => {
    const blocks = [
      { _type: "videoFeature", youtubeUrl: "https://youtu.be/aaaaaaaaaaa" },
      {
        _type: "bigVideoFeature",
        youtubeUrl: "https://www.youtube.com/watch?v=aaaaaaaaaaa",
      },
      { _type: "youtube", videoId: "aaaaaaaaaaa" },
    ];

    expect(collectYouTubeVideoIds(blocks)).toEqual(["aaaaaaaaaaa"]);
  });

  it("collects from the post body alongside blocks", () => {
    const body = [
      { _type: "block", children: [{ _type: "span", text: "hi" }] },
      { _type: "youtube", url: "https://youtu.be/bbbbbbbbbbb" },
    ];

    expect(collectYouTubeVideoIds([], body)).toEqual(["bbbbbbbbbbb"]);
  });

  it("ignores channel links, invalid URLs, and malformed IDs", () => {
    const blocks = [
      {
        _type: "youtubeChannelFeature",
        youtubeButton: { url: "https://www.youtube.com/@JimmyVercellino" },
      },
      { _type: "videoFeature", youtubeUrl: "https://vimeo.com/12345" },
      { _type: "youtube", videoId: "too-short" },
      { _type: "youtube", url: "not a url" },
    ];

    expect(collectYouTubeVideoIds(blocks)).toEqual([]);
  });

  it("strips stega characters before parsing", () => {
    const blocks = [
      {
        _type: "videoFeature",
        youtubeUrl: `https://youtu.be/aaaaaaaaaaa${stega}`,
      },
      { _type: "youtube", videoId: `bbbbbbbbbbb${stega}` },
    ];

    expect(collectYouTubeVideoIds(blocks)).toEqual([
      "aaaaaaaaaaa",
      "bbbbbbbbbbb",
    ]);
  });
});

describe("createVideoObjectJsonLd", () => {
  it("builds a VideoObject referencing the Person entity by @id only", () => {
    expect(
      createVideoObjectJsonLd(metadata(), "https://phxhomeloan.com/"),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: "VA Loans Explained",
      description: "Everything veterans need to know.",
      thumbnailUrl: "https://i.ytimg.com/vi/abc123def45/maxresdefault.jpg",
      uploadDate: "2025-04-01T12:00:00Z",
      duration: "PT4M20S",
      embedUrl: "https://www.youtube-nocookie.com/embed/abc123def45",
      author: {
        "@type": "Person",
        "@id": "https://phxhomeloan.com/#jimmy",
      },
    });
  });

  it("omits empty description and missing duration instead of failing", () => {
    const value = createVideoObjectJsonLd(
      metadata({ description: "  ", duration: null }),
      "https://phxhomeloan.com",
    );

    expect(value).not.toBeNull();
    expect(value).not.toHaveProperty("description");
    expect(value).not.toHaveProperty("duration");
  });

  it.each([
    ["title", metadata({ title: "  " })],
    ["publishedAt", metadata({ publishedAt: "" })],
    ["thumbnailUrl", metadata({ thumbnailUrl: "" })],
  ])("returns null when %s is missing", (_field, input) => {
    expect(createVideoObjectJsonLd(input, "https://phxhomeloan.com")).toBeNull();
  });
});

describe("serializeVideoJsonLd", () => {
  it("escapes < and round-trips as valid JSON", () => {
    const value = createVideoObjectJsonLd(
      metadata({ title: "Loans <fast>" }),
      "https://phxhomeloan.com",
    );
    const serialized = serializeVideoJsonLd([value!]);

    expect(serialized).not.toContain("<");
    expect(JSON.parse(serialized)).toEqual([
      expect.objectContaining({ name: "Loans <fast>" }),
    ]);
  });
});
