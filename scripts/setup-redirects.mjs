#!/usr/bin/env node
import { pathToFileURL } from "node:url";

const name = "sanity-redirects";
const filter = '_type == "redirect"';

export async function setupRedirects(env, fetcher = fetch) {
  for (const key of [
    "VERCEL_TOKEN",
    "VERCEL_PROJECT_ID",
    "SANITY_AUTH_TOKEN",
    "SANITY_STUDIO_PROJECT_ID",
    "SANITY_STUDIO_DATASET",
  ]) {
    if (!env[key]?.trim())
      throw new Error(`Missing ${key}. See docs/deployment.md.`);
  }
  const project = encodeURIComponent(env.VERCEL_PROJECT_ID);
  const team = env.VERCEL_TEAM_ID
    ? `?teamId=${encodeURIComponent(env.VERCEL_TEAM_ID)}`
    : "";
  const sanityUrl = `https://api.sanity.io/v2021-10-04/hooks/projects/${encodeURIComponent(env.SANITY_STUDIO_PROJECT_ID)}`;
  async function request(url, token, body) {
    let response;
    try {
      response = await fetcher(url, {
        method: body ? "POST" : "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(30000),
        redirect: "error",
      });
    } catch {
      throw new Error(
        "Hook API request failed. Check connectivity and run setup again.",
      );
    }
    // API bodies and URLs can contain secrets. Never include them in errors.
    if (!response.ok)
      throw new Error(
        `Hook API returned HTTP ${response.status}. Check token permissions and project settings.`,
      );
    try {
      return await response.json();
    } catch {
      throw new Error("Hook API returned invalid JSON.");
    }
  }
  const vercel = (path, body) =>
    request(`https://api.vercel.com${path}${team}`, env.VERCEL_TOKEN, body);
  let site = await vercel(`/v9/projects/${project}`);
  if (!site.link || site.link.productionBranch !== "main") {
    throw new Error(
      "Connect the Vercel project to Git and set its production branch to main first.",
    );
  }
  // Read both services before changing either one.
  const hooks = await request(sanityUrl, env.SANITY_AUTH_TOKEN);
  if (!Array.isArray(hooks))
    throw new Error("Sanity returned an invalid webhook list.");
  function deployHook() {
    const matches = (site.link.deployHooks ?? []).filter(
      (hook) => hook.name === name,
    );
    if (matches.length > 1 || (matches[0] && matches[0].ref !== "main")) {
      throw new Error(
        "Resolve the conflicting sanity-redirects deploy hook in Vercel before retrying.",
      );
    }
    return matches[0];
  }
  let hook = deployHook();
  if (!hook) {
    site = await vercel(`/v2/projects/${project}/deploy-hooks`, {
      name,
      ref: "main",
    });
    hook = deployHook();
  }
  if (!hook?.url?.startsWith("https://api.vercel.com/"))
    throw new Error(
      "Vercel did not return a valid deploy hook. Check its Git settings.",
    );
  const expected = {
    type: "document",
    name,
    url: hook.url,
    dataset: env.SANITY_STUDIO_DATASET,
    apiVersion: "v2025-02-19",
    httpMethod: "POST",
    isDisabled: false,
    includeDrafts: false,
    includeAllVersions: false,
    rule: { on: ["create", "update", "delete"], filter, projection: "{_id}" },
  };
  const existing = hooks.filter((item) => item.name === name);
  function matches(item) {
    return (
      ["type", "url", "dataset", "apiVersion", "httpMethod"].every(
        (key) => item[key] === expected[key],
      ) &&
      item.isDisabled === false &&
      item.includeDrafts === false &&
      item.includeAllVersions === false &&
      item.rule?.filter === filter &&
      item.rule?.projection === "{_id}" &&
      Array.isArray(item.rule?.on) &&
      JSON.stringify([...item.rule.on].sort()) ===
        JSON.stringify([...expected.rule.on].sort())
    );
  }
  if (existing.length > 1 || (existing.length && !matches(existing[0]))) {
    throw new Error(
      "Resolve the conflicting sanity-redirects webhook in Sanity before retrying. Existing settings were not overwritten.",
    );
  }
  if (!existing.length)
    await request(sanityUrl, env.SANITY_AUTH_TOKEN, expected);
  const confirmed = await request(sanityUrl, env.SANITY_AUTH_TOKEN);
  if (!confirmed.some((item) => item.name === name && matches(item)))
    throw new Error(
      "Sanity webhook verification failed. Check its API settings and run setup again.",
    );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    if (process.argv.length > 2) throw new Error("Usage: pnpm setup:redirects");
    await setupRedirects(process.env);
    console.log(
      "Redirect hooks are configured. No hook URL was printed or saved locally.",
    );
    console.log(
      "Confirm Vercel Settings > Git > Deploy Hooks: sanity-redirects, branch main.",
    );
    console.log(
      "Confirm Sanity Manage > API > Webhooks: sanity-redirects, your dataset, create/update/delete, drafts and versions off.",
    );
    console.log(
      "Publish a temporary Redirect, check the production deploy, edit its draft and check that no deploy starts, then delete it and check the next deploy. See docs/deployment.md.",
    );
  } catch (error) {
    console.error(`Redirect setup failed: ${error.message}`);
    process.exitCode = 1;
  }
}
