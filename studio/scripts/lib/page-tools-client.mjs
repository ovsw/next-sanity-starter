import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";

/** Load Studio credentials even when invoked outside the Studio directory. */
export function getPageToolsClient() {
  const file = fileURLToPath(new URL("../../.env.local", import.meta.url));
  if (existsSync(file)) loadEnvFile(file);
  const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
  const dataset = process.env.SANITY_STUDIO_DATASET;
  const token = process.env.SANITY_AUTH_TOKEN;
  if (!projectId || !dataset || !token) {
    throw new Error("Set SANITY_STUDIO_PROJECT_ID, SANITY_STUDIO_DATASET, and SANITY_AUTH_TOKEN in studio/.env.local.");
  }
  return createClient({
    projectId, dataset, token,
    apiVersion: process.env.SANITY_STUDIO_API_VERSION || "2026-03-23",
    useCdn: false,
    perspective: "raw",
  });
}
