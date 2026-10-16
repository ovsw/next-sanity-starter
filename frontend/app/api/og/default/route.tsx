import {
  createOgImageResponse,
  createPlainOgImageResponse,
} from "@/lib/og-image-response";
import { siteName } from "@/lib/site-name";

export async function GET() {
  let response: Response;
  try {
    response = await createOgImageResponse({ eyebrow: "", title: siteName });
  } catch (error) {
    // Page and post cards redirect here when they fail, so this route must not
    // depend on the same brand files.
    console.error("Default OG image generation failed", error);
    return createPlainOgImageResponse(siteName);
  }
  // This URL has no revision, so it must refresh after a brand update.
  for (const header of ["Cache-Control", "CDN-Cache-Control", "Vercel-CDN-Cache-Control"]) {
    response.headers.set(header, "public, max-age=3600");
  }
  return response;
}
