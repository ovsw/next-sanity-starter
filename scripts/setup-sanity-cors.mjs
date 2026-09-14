#!/usr/bin/env node

// Print the required origins. Hosted configuration is always a manual step.
import { desiredSanityOrigins } from "./worktree-config.mjs";

function main() {
  if (process.argv.length > 2) {
    throw new Error(
      "Usage: node scripts/setup-sanity-cors.mjs (prints origins; makes no changes)",
    );
  }
  const previewUrl = process.env.SANITY_STUDIO_PREVIEW_URL?.trim();
  if (!previewUrl) {
    throw new Error(
      "Missing SANITY_STUDIO_PREVIEW_URL in studio/.env.production.",
    );
  }
  const productionUrl = new URL(previewUrl);
  if (!["http:", "https:"].includes(productionUrl.protocol)) {
    throw new Error(
      "SANITY_STUDIO_PREVIEW_URL in studio/.env.production must use http or https.",
    );
  }
  const productionOrigin = productionUrl.origin;
  console.log("Add these origins in your Sanity project's API / CORS settings.");
  console.log("Enable credentials for each origin. No hosted settings were changed.");
  for (const { origin } of desiredSanityOrigins({ productionOrigin })) {
    console.log(origin);
  }
}

try {
  main();
} catch (error) {
  console.error(`CORS setup failed: ${error.message}`);
  process.exitCode = 1;
}
