import { getYouTubeVideoMetadata } from "@/lib/get-youtube-video-metadata";
import {
  collectYouTubeVideoIds,
  createVideoObjectJsonLd,
  serializeVideoJsonLd,
  type VideoObjectJsonLd,
} from "@/lib/video-json-ld";

async function VideoJsonLdScript({
  siteUrl,
  videoIds,
}: {
  siteUrl: string;
  videoIds: readonly string[];
}) {
  const settled = await Promise.allSettled(videoIds.map(getYouTubeVideoMetadata));
  const values = settled
    .map((result, index) => {
      if (result.status === "rejected") {
        console.warn(
          `[video-json-ld] Skipping VideoObject for ${videoIds[index]}:`,
          result.reason,
        );
        return null;
      }
      return result.value && createVideoObjectJsonLd(result.value, siteUrl);
    })
    .filter((value): value is VideoObjectJsonLd => value !== null);

  if (values.length === 0) return null;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: serializeVideoJsonLd(values) }}
      type="application/ld+json"
    />
  );
}

// Emits one VideoObject per distinct YouTube video rendered on the page —
// fully automatic, no editor action. Videos whose metadata can't be fetched
// are skipped rather than emitted invalid. Sync until videos are actually
// found, so video-free pages never enter the async fetch path.
export default function VideoJsonLd({
  blocks,
  postBody,
  siteUrl,
}: {
  blocks: readonly unknown[];
  postBody?: readonly unknown[];
  siteUrl: string;
}) {
  const videoIds = collectYouTubeVideoIds(blocks, postBody);
  if (videoIds.length === 0) return null;

  if (!process.env.YOUTUBE_API_KEY) {
    console.warn(
      "[video-json-ld] YOUTUBE_API_KEY is not set; skipping VideoObject JSON-LD",
    );
    return null;
  }

  return <VideoJsonLdScript siteUrl={siteUrl} videoIds={videoIds} />;
}
