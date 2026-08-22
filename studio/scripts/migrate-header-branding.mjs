import { createReadStream } from "node:fs";
import process from "node:process";
import { createClient } from "@sanity/client";

function required(value, message) {
  if (typeof value !== "string" || !value.trim()) throw new Error(message);
  return value.trim();
}

async function run() {
  process.loadEnvFile(".env");
  process.loadEnvFile("../frontend/.env.local");
  const apply = process.argv.includes("--apply");
  const logoArgument = process.argv.find((value) => value.startsWith("--logo-path="));
  const logoPath = logoArgument?.slice("--logo-path=".length);
  const client = createClient({
    apiVersion: "2026-08-02",
    dataset: required(process.env.SANITY_STUDIO_DATASET, "Missing dataset"),
    perspective: "raw",
    projectId: required(process.env.SANITY_STUDIO_PROJECT_ID, "Missing project ID"),
    token: required(
      process.env.SANITY_AUTH_TOKEN || process.env.SANITY_API_READ_TOKEN,
      "Missing Sanity token",
    ),
    useCdn: false,
  });
  const settings = await client.getDocument("settings");
  if (!settings) throw new Error("Missing settings singleton");
  const siteName = settings.siteName || settings.siteTitle || "PHX Home Loan";

  console.log(
    JSON.stringify({
      hasLogo: Boolean(settings.logo?.light?.asset?._ref),
      mode: apply ? "apply" : "dry-run",
      siteName,
    }),
  );
  if (!apply) return;
  if (settings.logo?.light?.asset?._ref && settings.siteName === siteName) {
    console.log(JSON.stringify({ noOp: true, verified: true }));
    return;
  }
  required(logoPath, "Pass --logo-path=<legacy logo file>");

  const asset = await client.assets.upload("image", createReadStream(logoPath), {
    filename: "phx-luminate-logo-stacked.png",
  });
  await client
    .patch("settings")
    .ifRevisionId(settings._rev)
    .set({
      siteName,
      logo: {
        _type: "object",
        height: 125,
        light: {
          _type: "image",
          asset: { _ref: asset._id, _type: "reference" },
        },
        width: 300,
      },
    })
    .commit({ visibility: "sync" });

  const stored = await client.getDocument("settings");
  if (stored?.siteName !== siteName || stored?.logo?.light?.asset?._ref !== asset._id) {
    throw new Error("Stored header branding did not match the migration");
  }
  console.log(JSON.stringify({ assetId: asset._id, siteName, verified: true }));
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
