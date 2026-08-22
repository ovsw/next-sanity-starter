import {
  collectAuthoredVideoMetadata,
  createVideoObjectJsonLd,
  serializeVideoJsonLd,
} from "@/lib/video-json-ld";

// Emits one VideoObject per distinct YouTube video when editors supplied the
// required search-visible facts. Embeds still render when these fields are
// empty; incomplete videos are only skipped for structured data.
export default function VideoJsonLd({
  blocks,
  postBody,
  siteUrl,
}: {
  blocks: readonly unknown[];
  postBody?: readonly unknown[];
  siteUrl: string;
}) {
  const values = collectAuthoredVideoMetadata(blocks, postBody)
    .map((metadata) => createVideoObjectJsonLd(metadata, siteUrl))
    .filter((value) => value !== null);

  if (values.length === 0) return null;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: serializeVideoJsonLd(values) }}
      type="application/ld+json"
    />
  );
}
