#!/usr/bin/env node

// Print the required origins. Hosted configuration is always a manual step.
import { desiredSanityOrigins } from "./worktree-config.mjs";

if (process.argv.length > 2) {
  console.error("Usage: node scripts/setup-sanity-cors.mjs (prints origins; makes no changes)");
  process.exitCode = 1;
} else {
  console.log("Add these origins in your Sanity project's API / CORS settings.");
  console.log("Enable credentials for each origin. No hosted settings were changed.");
  for (const { origin } of desiredSanityOrigins()) console.log(origin);
}
