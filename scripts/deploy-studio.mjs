import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { isIP } from "node:net";
import path from "node:path";
import { parseEnv } from "node:util";

const studioDirectory = path.resolve(import.meta.dirname, "../studio");

try {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--first") || args.length > 1) {
    throw new Error("Studio deployment accepts only --first. Run pnpm deploy:studio.");
  }
  // Sanity creates the app ID on the first deployment, so only that run may go
  // without one. It must be asked for, so a lost ID never creates a second Studio.
  const first = args[0] === "--first";

  const local = parseEnv(readFileSync(path.join(studioDirectory, ".env.local"), "utf8"));
  const production = parseEnv(readFileSync(path.join(studioDirectory, ".env.production"), "utf8"));
  const previewUrl = production.SANITY_STUDIO_PREVIEW_URL?.trim();
  const appId = production.SANITY_STUDIO_APP_ID?.trim();
  const token = local.SANITY_AUTH_TOKEN?.trim();

  if (!previewUrl) {
    throw new Error("Set SANITY_STUDIO_PREVIEW_URL in studio/.env.production.");
  }
  if (first && appId) {
    throw new Error("studio/.env.production already has SANITY_STUDIO_APP_ID. Run pnpm deploy:studio without --first.");
  }
  if (!first && !appId) {
    throw new Error("Set SANITY_STUDIO_APP_ID in studio/.env.production. For the first deployment of a new project, run pnpm deploy:studio --first.");
  }
  if (!token) {
    throw new Error("Set SANITY_AUTH_TOKEN in studio/.env.local before deploying Studio.");
  }

  const url = new URL(previewUrl);
  const hostname = url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (
    url.protocol !== "https:" ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    !hostname.includes(".") ||
    isIP(hostname) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("The production preview URL must be an HTTPS website origin, without localhost, an IP address, credentials, or a page path.");
  }

  console.log(
    first
      ? `Deploying a new Studio with preview ${url.origin}`
      : `Deploying Studio ${appId} with preview ${url.origin}`,
  );
  const env = {
    ...process.env,
    ...local,
    ...production,
    SANITY_AUTH_TOKEN: token,
    SANITY_STUDIO_PREVIEW_URL: url.origin,
    SANITY_STUDIO_APP_ID: appId,
    SANITY_ACTIVE_ENV: "production",
    NODE_ENV: "production",
  };
  if (first) delete env.SANITY_STUDIO_APP_ID;
  const result = spawnSync("pnpm", ["exec", "sanity", "deploy"], {
    cwd: studioDirectory,
    stdio: "inherit",
    env,
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
  if (first && result.status === 0) {
    console.log("Save the app ID that Sanity printed as SANITY_STUDIO_APP_ID in studio/.env.production, then commit the file.");
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
