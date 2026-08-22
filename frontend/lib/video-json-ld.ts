import { stegaClean } from "next-sanity";
import { getYouTubeVideoId, isYouTubeVideoId } from "@/lib/youtube-video-id";
import type { YouTubeVideoMetadata } from "@/lib/youtube-metadata";

export type VideoObjectJsonLd = {
  "@context": "https://schema.org";
  "@type": "VideoObject";
  name: string;
  description?: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string;
  embedUrl: string;
  author: {
    "@type": "Person";
    "@id": string;
  };
};

// Walks page-builder blocks and portable-text bodies for every YouTube video
// the page renders: `videoFeature`/`bigVideoFeature` youtubeUrl fields plus
// portable-text `youtube` nodes (which store either a `url` or a bare
// `videoId` depending on the schema). Returns distinct IDs in render order.
export function collectYouTubeVideoIds(
  blocks: readonly unknown[],
  postBody?: readonly unknown[],
): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();

  const add = (videoId: string | null) => {
    if (videoId && !seen.has(videoId)) {
      seen.add(videoId);
      ids.push(videoId);
    }
  };

  const walk = (value: unknown) => {
    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }
    if (!value || typeof value !== "object") return;

    const node = value as Record<string, unknown>;
    const type = node._type;

    if (
      (type === "videoFeature" || type === "bigVideoFeature") &&
      typeof node.youtubeUrl === "string"
    ) {
      add(getYouTubeVideoId(stegaClean(node.youtubeUrl)));
    }

    if (type === "youtube") {
      if (typeof node.url === "string") {
        add(getYouTubeVideoId(stegaClean(node.url)));
      }
      if (typeof node.videoId === "string") {
        const videoId = stegaClean(node.videoId)?.trim();
        if (isYouTubeVideoId(videoId)) add(videoId);
      }
      return;
    }

    for (const child of Object.values(node)) walk(child);
  };

  walk(blocks);
  if (postBody) walk(postBody);

  return ids;
}

// Builds one VideoObject from fetched YouTube metadata. The author is a bare
// reference to the site-wide Person entity (person-json-ld.ts) — never a
// duplicate of its data. Returns null instead of emitting invalid schema when
// a required field (name, thumbnailUrl, uploadDate) is missing.
export function createVideoObjectJsonLd(
  metadata: YouTubeVideoMetadata,
  siteUrl: string,
): VideoObjectJsonLd | null {
  const name = metadata.title.trim();
  if (!name || !metadata.thumbnailUrl || !metadata.publishedAt) return null;

  const description = metadata.description.trim();
  const normalizedSiteUrl = siteUrl.replace(/\/$/, "");

  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name,
    ...(description ? { description } : {}),
    thumbnailUrl: metadata.thumbnailUrl,
    uploadDate: metadata.publishedAt,
    ...(metadata.duration ? { duration: metadata.duration } : {}),
    embedUrl: `https://www.youtube-nocookie.com/embed/${metadata.videoId}`,
    author: {
      "@type": "Person",
      "@id": `${normalizedSiteUrl}/#jimmy`,
    },
  };
}

export function serializeVideoJsonLd(values: readonly VideoObjectJsonLd[]) {
  return JSON.stringify(values).replace(/</g, "\\u003c");
}
