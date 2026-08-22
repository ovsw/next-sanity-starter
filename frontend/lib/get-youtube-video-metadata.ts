import "server-only";
import { cacheLife } from "next/cache";
import {
  mapYouTubeVideoApiItem,
  type YouTubeVideoApiItem,
  type YouTubeVideoMetadata,
} from "@/lib/youtube-metadata";

async function fetchYouTubeVideoMetadata(videoId: string) {
  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "snippet,contentDetails,status");
  url.searchParams.set("id", videoId);
  // Callers guard on the key; asserting here keeps the cached fn self-contained.
  url.searchParams.set("key", process.env.YOUTUBE_API_KEY ?? "");

  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) {
    throw new Error(`YouTube API responded with ${response.status}`);
  }

  const payload = (await response.json()) as { items?: YouTubeVideoApiItem[] };
  return mapYouTubeVideoApiItem(payload.items?.[0], videoId);
}

// Successes and durable facts (video deleted, private, or non-embeddable →
// null) cache for weeks. Transient failures (timeout, quota, outage) return
// null under a minutes-long lifetime instead, so they back off briefly
// without poisoning the long cache.
export async function getYouTubeVideoMetadata(
  videoId: string,
): Promise<YouTubeVideoMetadata | null> {
  "use cache";

  try {
    const metadata = await fetchYouTubeVideoMetadata(videoId);
    cacheLife("weeks");
    if (!metadata) {
      console.warn(
        `[video-json-ld] Skipping VideoObject for ${videoId}: video is missing, not public, or not embeddable`,
      );
    }
    return metadata;
  } catch (error) {
    cacheLife("minutes");
    console.warn(
      `[video-json-ld] Skipping VideoObject for ${videoId} this round (transient YouTube failure, will retry):`,
      error,
    );
    return null;
  }
}
