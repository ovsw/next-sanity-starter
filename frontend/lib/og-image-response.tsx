import { PostOgImage } from "@/components/post-og-image";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

const assets = Promise.all(
  ["font.woff", "wordmark.svg", "mark.svg"].map((file) =>
    readFile(join(process.cwd(), "public/brand", file)),
  ),
);
// A missing brand file must fail the card request, not crash the server
// before any request awaits it.
assets.catch(() => {});
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
  photoUrl,
}: {
  eyebrow: string;
  title: string;
  photoUrl?: string;
}) {
  const [font, logo, mark] = await assets;

  const image = new ImageResponse(
    <PostOgImage
      eyebrow={eyebrow}
      title={title}
      photoUrl={photoUrl}
      logo={`data:image/svg+xml;base64,${logo.toString("base64")}`}
      mark={`data:image/svg+xml;base64,${mark.toString("base64")}`}
    />,
    {
      width: 1200,
      height: 630,
      headers: CACHE_HEADERS,
      fonts: [
        {
          name: "Brand",
          data: font,
          style: "normal",
          weight: 600,
        },
      ],
    },
  );
  // Read the stream here so route error handling also catches rendering failures.
  return new Response(await image.arrayBuffer(), { headers: image.headers });
}

/**
 * The last-resort card for `/api/og/default`. It reads no brand files, so it
 * still renders when they are missing or broken. A short cache lets the
 * branded card return as soon as the files are fixed.
 */
export async function createPlainOgImageResponse(title: string) {
  const image = new ImageResponse(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        height: "100%",
        padding: 80,
        background: "#163a46",
        color: "#ffffff",
        fontSize: 72,
      }}
    >
      {title}
    </div>,
    {
      width: 1200,
      height: 630,
      headers: {
        ...CACHE_HEADERS,
        "Cache-Control": "public, max-age=300",
        "CDN-Cache-Control": "public, max-age=300",
        "Vercel-CDN-Cache-Control": "public, max-age=300",
      },
    },
  );
  return new Response(await image.arrayBuffer(), { headers: image.headers });
}

export function ogImageFallbackResponse(
  error: unknown,
  context: "Page" | "Post",
) {
  console.error(`${context} OG image generation failed`, error);
  return new Response(null, {
    status: 302,
    headers: {
      "Cache-Control": "public, max-age=300",
      Location: new URL(
        "/api/og/default",
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      ).toString(),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
