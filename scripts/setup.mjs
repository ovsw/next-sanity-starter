#!/usr/bin/env node

import { randomBytes } from "node:crypto";
import { access, chmod, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createInterface } from "node:readline/promises";
import { pathToFileURL } from "node:url";

const ARGUMENTS = {
  "--site-name": "siteName",
  "--site-url": "siteUrl",
  "--project-id": "projectId",
  "--dataset": "dataset",
  "--read-token": "readToken",
  "--sanity-auth-token": "sanityAuthToken",
  "--studio-hostname": "studioHostname",
};

function requiredValue(name, value) {
  const result = value?.trim();
  if (!result) throw new Error(`Missing required value: ${name}`);
  if (/\r|\n/.test(result)) throw new Error(`${name} must be one line`);
  return result;
}

export function validateSetupValues(input) {
  const siteName = requiredValue("site name", input.siteName);
  const projectId = requiredValue("Sanity project ID", input.projectId);
  const dataset = requiredValue("Sanity dataset", input.dataset);
  const readToken = requiredValue("Sanity API read token", input.readToken);
  const sanityAuthToken = requiredValue(
    "Sanity auth token",
    input.sanityAuthToken,
  );
  const studioHostname = normalizeStudioHostname(
    requiredValue("Studio hostname", input.studioHostname),
  );
  const siteUrl = normalizeSiteUrl(requiredValue("public URL", input.siteUrl));

  if (!/^[a-z0-9]+$/.test(projectId)) {
    throw new Error("Sanity project ID must use lowercase letters and numbers");
  }
  if (!/^[a-z0-9_-]+$/i.test(dataset)) {
    throw new Error(
      "Sanity dataset must use letters, numbers, underscores, or hyphens",
    );
  }
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(studioHostname)) {
    throw new Error(
      "Studio hostname must use lowercase letters, numbers, or internal hyphens",
    );
  }

  return {
    dataset,
    projectId,
    readToken,
    sanityAuthToken,
    siteName,
    siteUrl,
    studioHostname,
  };
}

function normalizeSiteUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Public URL must be a valid http or https URL");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Public URL must use http or https");
  }
  if (
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("Public URL must be an origin without a path or credentials");
  }
  return url.origin;
}

function normalizeStudioHostname(value) {
  return value
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\.sanity\.studio\/?$/, "")
    .replace(/\/$/, "");
}

export function buildEnvironmentFiles(values, ogImageSecret = randomBytes(32).toString("hex")) {
  const config = validateSetupValues(values);
  const quotedSiteName = JSON.stringify(config.siteName);
  const studioUrl = `https://${config.studioHostname}.sanity.studio`;

  return {
    frontend: [
      `NEXT_PUBLIC_SITE_NAME=${quotedSiteName}`,
      `NEXT_PUBLIC_SITE_URL=${config.siteUrl}`,
      "NEXT_PUBLIC_SITE_ENV=development",
      `NEXT_PUBLIC_STUDIO_URL=${studioUrl}`,
      "NEXT_PUBLIC_SANITY_API_VERSION=2026-03-23",
      `NEXT_PUBLIC_SANITY_PROJECT_ID=${config.projectId}`,
      `NEXT_PUBLIC_SANITY_DATASET=${config.dataset}`,
      `OG_IMAGE_SECRET=${ogImageSecret}`,
      `SANITY_API_READ_TOKEN=${config.readToken}`,
      "",
    ].join("\n"),
    studio: [
      `SANITY_STUDIO_TITLE=${quotedSiteName}`,
      `SANITY_STUDIO_PREVIEW_URL=${config.siteUrl}`,
      "SANITY_STUDIO_API_VERSION=2026-03-23",
      `SANITY_STUDIO_PROJECT_ID=${config.projectId}`,
      `SANITY_STUDIO_DATASET=${config.dataset}`,
      `SANITY_STUDIO_HOSTNAME=${config.studioHostname}`,
      `SANITY_AUTH_TOKEN=${config.sanityAuthToken}`,
      "",
    ].join("\n"),
  };
}

export async function writeSetupFiles(rootDirectory, values, { force = false } = {}) {
  const files = buildEnvironmentFiles(values);
  const targets = [
    [path.join(rootDirectory, "frontend", ".env.local"), files.frontend],
    [path.join(rootDirectory, "studio", ".env.local"), files.studio],
  ];

  await Promise.all(
    targets.map(async ([target]) => {
      try {
        await access(target);
        if (!force) {
          throw new Error(
            `${path.relative(rootDirectory, target)} already exists. Re-run with --force to replace local setup.`,
          );
        }
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
    }),
  );

  await Promise.all(
    targets.map(async ([target, contents]) => {
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, contents, {
        encoding: "utf8",
        flag: "w",
        mode: 0o600,
      });
      await chmod(target, 0o600);
    }),
  );
}

function parseArguments(argumentsList) {
  const result = { force: false };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === "--force") {
      result.force = true;
      continue;
    }
    const key = ARGUMENTS[argument];
    if (!key) throw new Error(`Unknown option: ${argument}`);
    result[key] = argumentsList[index + 1];
    index += 1;
  }
  return result;
}

async function collectValues(provided) {
  const prompts = [
    ["siteName", "Site name", undefined, false],
    ["siteUrl", "Public URL", "http://localhost:3000", false],
    ["projectId", "Sanity project ID", undefined, false],
    ["dataset", "Sanity dataset", "production", false],
    ["readToken", "Sanity API read token", undefined, true],
    ["sanityAuthToken", "Sanity auth token", undefined, true],
    ["studioHostname", "Studio hostname", undefined, false],
  ];
  const values = { ...provided };
  const missing = prompts.filter(([key]) => !values[key]);
  if (!missing.length) return values;
  if (!process.stdin.isTTY) {
    const names = missing.map(([, label]) => label).join(", ");
    throw new Error(`Missing required value: ${names}`);
  }

  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  try {
    for (const [key, label, defaultValue, secret] of missing) {
      const suffix = defaultValue ? ` [${defaultValue}]` : "";
      const answer = secret
        ? await askSecret(terminal, `${label}${suffix}: `)
        : await terminal.question(`${label}${suffix}: `);
      values[key] = answer.trim() || defaultValue;
    }
  } finally {
    terminal.close();
  }
  return values;
}

async function askSecret(terminal, prompt) {
  const writeToOutput = terminal._writeToOutput;
  terminal._writeToOutput = () => {};
  try {
    terminal.output.write(prompt);
    const answer = await terminal.question("");
    terminal.output.write("\n");
    return answer;
  } finally {
    terminal._writeToOutput = writeToOutput;
  }
}

async function main() {
  const argumentsMap = parseArguments(process.argv.slice(2));
  const values = await collectValues(argumentsMap);
  await writeSetupFiles(process.cwd(), values, { force: argumentsMap.force });
  console.log("Local Website and Studio configuration written.");
  console.log("No hosted resources were created or changed.");
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((error) => {
    console.error(`Setup failed: ${error.message}`);
    process.exitCode = 1;
  });
}
