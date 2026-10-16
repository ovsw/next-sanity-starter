import { defineEnableDraftMode } from "next-sanity/draft-mode";
import { client } from "@/sanity/lib/client";
import { token } from "@/sanity/lib/token";

const missingTokenMessage =
  "Missing SANITY_API_READ_TOKEN. Add it to frontend/.env.local to use Sanity Presentation draft previews.";

const draftModeHandler = token
  ? defineEnableDraftMode({
      client: client.withConfig({ token }),
    })
  : {
      GET: () => {
        console.error(missingTokenMessage);
        return new Response(missingTokenMessage, { status: 500 });
      },
    };

// Keep draft cookies unpartitioned so Presentation's "Open preview" tab can
// use them too. Chromium must allow third-party cookies; Safari is unsupported.
// The Sanity handler still validates the preview secret.
export async function GET(request: Request) {
  const headers = new Headers(request.headers);
  headers.delete("sec-fetch-dest");
  return draftModeHandler.GET(new Request(request.url, { headers }));
}
