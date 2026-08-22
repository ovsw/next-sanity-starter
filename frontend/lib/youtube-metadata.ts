// Pure mapping of a YouTube Data API v3 `videos.list` item to the metadata a
// VideoObject needs. Kept free of "server-only"/"use cache" so it stays unit
// testable; the cached fetch lives in get-youtube-video-metadata.ts.

export type YouTubeVideoMetadata = {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;
  duration: string | null;
};

type YouTubeThumbnail = { url?: string };

export type YouTubeVideoApiItem = {
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    thumbnails?: Partial<
      Record<"maxres" | "standard" | "high" | "medium" | "default", YouTubeThumbnail>
    >;
  };
  contentDetails?: { duration?: string };
  status?: { privacyStatus?: string; embeddable?: boolean };
};

const thumbnailSizes = ["maxres", "standard", "high", "medium", "default"] as const;

// Returns null for durable non-facts: the video is gone, not public, or not
// embeddable (its embedUrl would be dead). Those nulls are safe to cache
// long-term, unlike transient fetch failures which must throw instead.
export function mapYouTubeVideoApiItem(
  item: YouTubeVideoApiItem | undefined,
  videoId: string,
): YouTubeVideoMetadata | null {
  if (!item) return null;

  const { snippet, status } = item;
  if (status?.privacyStatus !== "public" || status.embeddable === false) {
    return null;
  }

  const thumbnailUrl =
    thumbnailSizes
      .map((size) => snippet?.thumbnails?.[size]?.url)
      .find(Boolean) ?? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  return {
    videoId,
    title: snippet?.title ?? "",
    description: snippet?.description ?? "",
    publishedAt: snippet?.publishedAt ?? "",
    thumbnailUrl,
    duration: item.contentDetails?.duration ?? null,
  };
}
