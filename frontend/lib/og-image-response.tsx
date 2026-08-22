import { PostOgImage } from "@/components/post-og-image";
import { siteName } from "@/lib/site-name";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

const sourceSerifSemibold = readFile(
  join(
    process.cwd(),
    "node_modules/@fontsource/source-serif-4/files/source-serif-4-latin-600-normal.woff",
  ),
);
const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=31536000, immutable",
  "CDN-Cache-Control": "public, max-age=31536000, immutable",
  "Vercel-CDN-Cache-Control": "public, max-age=31536000, immutable",
  "Content-Security-Policy": "default-src 'none'",
  "X-Content-Type-Options": "nosniff",
};

export async function createOgImageResponse({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  const font = await sourceSerifSemibold;

  return new ImageResponse(
    <PostOgImage eyebrow={eyebrow} siteName={siteName} title={title} />,
    {
      width: 1200,
      height: 630,
      headers: CACHE_HEADERS,
      fonts: [
        {
          name: "Source Serif 4",
          data: font,
          style: "normal",
          weight: 600,
        },
      ],
    },
  );
}

export function ogImageFallbackResponse(error: unknown, context: "Page" | "Post") {
  console.error(`${context} OG image generation failed`, error);
  return new Response(null, {
    status: 302,
    headers: {
      "Cache-Control": "public, max-age=300",
      Location: new URL(
        "/images/og-post-fallback.png",
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      ).toString(),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
