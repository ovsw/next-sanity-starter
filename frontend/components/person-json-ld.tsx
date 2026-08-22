import {
  createPersonJsonLd,
  serializePersonJsonLd,
} from "@/lib/person-json-ld";

export default function PersonJsonLd({ siteUrl }: { siteUrl: string }) {
  const value = createPersonJsonLd(siteUrl);

  return (
    <script
      dangerouslySetInnerHTML={{ __html: serializePersonJsonLd(value) }}
      type="application/ld+json"
    />
  );
}
