import { describe, expect, it } from "vitest";
import {
  collectAuthoredVideoMetadata,
  collectYouTubeVideoIds,
  createVideoObjectJsonLd,
  serializeVideoJsonLd,
} from "./video-json-ld";
import type { AuthoredVideoMetadata } from "./video-json-ld";

const stega = "\u200b\u200c\u200d\ufeff";

function metadata(
  overrides: Partial<AuthoredVideoMetadata> = {},
): AuthoredVideoMetadata {
  return {
    videoId: "abc123def45",
    title: "Planning a Useful Article",
    description: "A short editor-provided summary.",
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

describe("collectAuthoredVideoMetadata", () => {
  it("uses editor-authored page-builder metadata without a remote lookup", () => {
    expect(
      collectAuthoredVideoMetadata([
        {
          _type: "bigVideoFeature",
          description: "A useful overview.",
          thumbnailImage: {
            asset: {
              url: "https://cdn.sanity.io/images/project/dataset/video.jpg",
            },
          },
          title: "Watch the Overview",
          videoDuration: "PT2M30S",
          videoPublishedAt: "2026-08-01",
          youtubeUrl: "https://youtu.be/aaaaaaaaaaa",
        },
      ]),
    ).toEqual([
      {
        description: "A useful overview.",
        duration: "PT2M30S",
        publishedAt: "2026-08-01",
        thumbnailUrl: "https://cdn.sanity.io/images/project/dataset/video.jpg",
        title: "Watch the Overview",
        videoId: "aaaaaaaaaaa",
      },
    ]);
  });

  it("uses editor-authored Portable Text video metadata from post bodies", () => {
    expect(
      collectAuthoredVideoMetadata([], [
        {
          _type: "youtube",
          description: "How the idea works.",
          duration: "PT4M",
          publishedAt: "2026-08-02",
          thumbnailImage: {
            resolvedAsset: {
              url: "https://cdn.sanity.io/images/project/dataset/body-video.jpg",
            },
          },
          title: "Article Video",
          url: "https://www.youtube.com/watch?v=bbbbbbbbbbb",
        },
      ]),
    ).toEqual([
      {
        description: "How the idea works.",
        duration: "PT4M",
        publishedAt: "2026-08-02",
        thumbnailUrl: "https://cdn.sanity.io/images/project/dataset/body-video.jpg",
        title: "Article Video",
        videoId: "bbbbbbbbbbb",
      },
    ]);
  });

  it("fills missing metadata from a later duplicate video occurrence", () => {
    expect(
      collectAuthoredVideoMetadata(
        [
          {
            _type: "videoFeature",
            title: "Shared Video",
            youtubeUrl: "https://youtu.be/ccccccccccc",
          },
        ],
        [
          {
            _type: "youtube",
            duration: "PT5M",
            publishedAt: "2026-08-03",
            title: "Ignored Duplicate Title",
            url: "https://www.youtube.com/watch?v=ccccccccccc",
          },
        ],
      ),
    ).toEqual([
      {
        description: null,
        duration: "PT5M",
        publishedAt: "2026-08-03",
        thumbnailUrl: null,
        title: "Shared Video",
        videoId: "ccccccccccc",
      },
    ]);
  });

  it("prefers a later authored thumbnail over an earlier fallback", () => {
    const [metadata] = collectAuthoredVideoMetadata(
      [
        {
          _type: "videoFeature",
          title: "Shared Video",
          videoPublishedAt: "2026-08-04",
          youtubeUrl: "https://youtu.be/ddddddddddd",
        },
      ],
      [
        {
          _type: "youtube",
          thumbnailImage: {
            resolvedAsset: {
              url: "https://cdn.sanity.io/images/project/dataset/authored.jpg",
            },
          },
          url: "https://www.youtube.com/watch?v=ddddddddddd",
        },
      ],
    );

    expect(metadata?.thumbnailUrl).toBe(
      "https://cdn.sanity.io/images/project/dataset/authored.jpg",
    );
    expect(createVideoObjectJsonLd(metadata!, "https://example.com")).toEqual(
      expect.objectContaining({
        thumbnailUrl: "https://cdn.sanity.io/images/project/dataset/authored.jpg",
      }),
    );
  });
});

describe("createVideoObjectJsonLd", () => {
  it("builds a VideoObject from authored metadata", () => {
    expect(
      createVideoObjectJsonLd(metadata(), "https://example.com/"),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: "Planning a Useful Article",
      description: "A short editor-provided summary.",
      thumbnailUrl: "https://i.ytimg.com/vi/abc123def45/maxresdefault.jpg",
      uploadDate: "2025-04-01T12:00:00Z",
      duration: "PT4M20S",
      embedUrl: "https://www.youtube-nocookie.com/embed/abc123def45",
      publisher: {
        "@type": "Organization",
        "@id": "https://example.com/#organization",
      },
    });
  });

  it("omits empty description and missing duration instead of failing", () => {
    const value = createVideoObjectJsonLd(
      metadata({ description: "  ", duration: null }),
      "https://example.com",
    );

    expect(value).not.toBeNull();
    expect(value).not.toHaveProperty("description");
    expect(value).not.toHaveProperty("duration");
  });

  it.each([
    ["title", metadata({ title: "  " })],
    ["publishedAt", metadata({ publishedAt: "" })],
  ])("returns null when %s is missing", (_field, input) => {
    expect(createVideoObjectJsonLd(input, "https://example.com")).toBeNull();
  });

  it("uses a YouTube thumbnail when no authored thumbnail exists", () => {
    expect(
      createVideoObjectJsonLd(metadata({ thumbnailUrl: null }), "https://example.com"),
    ).toEqual(
      expect.objectContaining({
        thumbnailUrl: "https://img.youtube.com/vi/abc123def45/hqdefault.jpg",
      }),
    );
  });
});

describe("serializeVideoJsonLd", () => {
  it("escapes < and round-trips as valid JSON", () => {
    const value = createVideoObjectJsonLd(
      metadata({ title: "Articles <fast>" }),
      "https://example.com",
    );
    const serialized = serializeVideoJsonLd([value!]);

    expect(serialized).not.toContain("<");
    expect(JSON.parse(serialized)).toEqual([
      expect.objectContaining({ name: "Articles <fast>" }),
    ]);
  });
});
