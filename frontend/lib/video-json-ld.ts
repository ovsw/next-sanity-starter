import { stegaClean } from "next-sanity";
import { getYouTubeVideoId, isYouTubeVideoId } from "@/lib/youtube-video-id";

export type VideoObjectJsonLd = {
  "@context": "https://schema.org";
  "@type": "VideoObject";
  name: string;
  description?: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string;
  embedUrl: string;
  publisher: {
    "@type": "Organization";
    "@id": string;
  };
};

export type AuthoredVideoMetadata = {
  description?: string | null;
  duration?: string | null;
  publishedAt?: string | null;
  thumbnailUrl?: string | null;
  title?: string | null;
  videoId: string;
};

function getString(value: unknown) {
  return typeof value === "string" ? stegaClean(value)?.trim() || null : null;
}

function getImageUrl(image: unknown) {
  if (!image || typeof image !== "object") return null;
  const imageRecord = image as Record<string, unknown>;
  const asset = imageRecord.asset;
  const resolvedAsset = imageRecord.resolvedAsset;

  if (asset && typeof asset === "object") {
    const url = (asset as Record<string, unknown>).url;
    if (typeof url === "string") return stegaClean(url)?.trim() || null;
  }
  if (resolvedAsset && typeof resolvedAsset === "object") {
    const url = (resolvedAsset as Record<string, unknown>).url;
    if (typeof url === "string") return stegaClean(url)?.trim() || null;
  }

  return null;
}

function getFallbackThumbnailUrl(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function addVideo(
  videos: AuthoredVideoMetadata[],
  seen: Set<string>,
  source: AuthoredVideoMetadata,
) {
  if (seen.has(source.videoId)) return;
  seen.add(source.videoId);
  videos.push(source);
}

// Walks page-builder blocks and portable-text bodies for every YouTube video
// the page renders. Returns distinct videos in render order, using authored
// metadata only; no API key or remote metadata lookup is needed.
export function collectAuthoredVideoMetadata(
  blocks: readonly unknown[],
  postBody?: readonly unknown[],
): AuthoredVideoMetadata[] {
  const videos: AuthoredVideoMetadata[] = [];
  const seen = new Set<string>();

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
      const videoId = getYouTubeVideoId(stegaClean(node.youtubeUrl));
      if (videoId) {
        addVideo(videos, seen, {
          description: getString(node.description),
          duration: getString(node.videoDuration),
          publishedAt: getString(node.videoPublishedAt),
          thumbnailUrl: getImageUrl(node.thumbnailImage) ?? getFallbackThumbnailUrl(videoId),
          title: getString(node.title),
          videoId,
        });
      }
    }

    if (type === "youtube") {
      let videoId: string | null = null;
      if (typeof node.url === "string") {
        videoId = getYouTubeVideoId(stegaClean(node.url));
      }
      if (typeof node.videoId === "string") {
        const candidate = stegaClean(node.videoId)?.trim();
        if (isYouTubeVideoId(candidate)) videoId = candidate;
      }
      if (videoId) {
        addVideo(videos, seen, {
          description: getString(node.description),
          duration: getString(node.duration),
          publishedAt: getString(node.publishedAt),
          thumbnailUrl: getImageUrl(node.thumbnailImage) ?? getFallbackThumbnailUrl(videoId),
          title: getString(node.title),
          videoId,
        });
      }
      return;
    }

    for (const child of Object.values(node)) walk(child);
  };

  walk(blocks);
  if (postBody) walk(postBody);

  return videos;
}

export const collectYouTubeVideoIds = (
  blocks: readonly unknown[],
  postBody?: readonly unknown[],
) => collectAuthoredVideoMetadata(blocks, postBody).map(({ videoId }) => videoId);

// Builds one VideoObject from editor-authored metadata. Returns null instead
// of emitting invalid schema when required search-visible fields are missing.
export function createVideoObjectJsonLd(
  metadata: AuthoredVideoMetadata,
  siteUrl: string,
): VideoObjectJsonLd | null {
  const name = metadata.title?.trim() || "";
  if (!name || !metadata.thumbnailUrl || !metadata.publishedAt) return null;

  const description = metadata.description?.trim() || "";
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
    publisher: {
      "@type": "Organization",
      "@id": `${normalizedSiteUrl}/#organization`,
    },
  };
}

export function serializeVideoJsonLd(values: readonly VideoObjectJsonLd[]) {
  return JSON.stringify(values).replace(/</g, "\\u003c");
}
