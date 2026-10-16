import { createOgImageResponse } from "@/lib/og-image-response";
import { siteName } from "@/lib/site-name";

export async function GET() {
  const response = await createOgImageResponse({ eyebrow: "", title: siteName });
  // This URL has no revision, so it must refresh after a brand update.
  for (const header of ["Cache-Control", "CDN-Cache-Control", "Vercel-CDN-Cache-Control"]) {
    response.headers.set(header, "public, max-age=3600");
  }
  return response;
}
