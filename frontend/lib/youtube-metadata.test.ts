import { describe, expect, it } from "vitest";
import {
  mapYouTubeVideoApiItem,
  type YouTubeVideoApiItem,
} from "./youtube-metadata";

function item(overrides: Partial<YouTubeVideoApiItem> = {}): YouTubeVideoApiItem {
  return {
    snippet: {
      title: "VA Loans Explained",
      description: "Everything veterans need to know.",
      publishedAt: "2025-04-01T12:00:00Z",
      thumbnails: {
        maxres: { url: "https://i.ytimg.com/vi/abc123def45/maxresdefault.jpg" },
        default: { url: "https://i.ytimg.com/vi/abc123def45/default.jpg" },
      },
    },
    contentDetails: { duration: "PT4M20S" },
    status: { privacyStatus: "public", embeddable: true },
    ...overrides,
  };
}

describe("mapYouTubeVideoApiItem", () => {
  it("maps a public embeddable video, preferring the largest thumbnail", () => {
    expect(mapYouTubeVideoApiItem(item(), "abc123def45")).toEqual({
      videoId: "abc123def45",
      title: "VA Loans Explained",
      description: "Everything veterans need to know.",
      publishedAt: "2025-04-01T12:00:00Z",
      thumbnailUrl: "https://i.ytimg.com/vi/abc123def45/maxresdefault.jpg",
      duration: "PT4M20S",
    });
  });

  it("falls back to the img.youtube.com thumbnail when none are listed", () => {
    const value = mapYouTubeVideoApiItem(
      item({ snippet: { ...item().snippet, thumbnails: {} } }),
      "abc123def45",
    );

    expect(value?.thumbnailUrl).toBe(
      "https://img.youtube.com/vi/abc123def45/hqdefault.jpg",
    );
  });

  it("returns null for a deleted video (no item)", () => {
    expect(mapYouTubeVideoApiItem(undefined, "abc123def45")).toBeNull();
  });

  it.each([
    ["private", item({ status: { privacyStatus: "private", embeddable: true } })],
    ["unlisted", item({ status: { privacyStatus: "unlisted", embeddable: true } })],
    [
      "non-embeddable",
      item({ status: { privacyStatus: "public", embeddable: false } }),
    ],
  ])("returns null for a %s video", (_label, input) => {
    expect(mapYouTubeVideoApiItem(input, "abc123def45")).toBeNull();
  });
});
