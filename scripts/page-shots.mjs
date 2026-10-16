#!/usr/bin/env node
// Screenshot every Page Builder section of one page draft, at desktop and
// phone widths, through the frontend's draft mode.
//
//   pnpm page:shots <slug> [--out <dir>] [--only desktop|phone]
//
// Reads SANITY_AUTH_TOKEN from the environment or studio/.env.local, the dev ports from .worktree-ports.json, and writes
// <out>/<viewport>/<nn>-<sectionKey>.png. Prints one JSON line per viewport
// with the page height and every section's height. It stops when the rendered
// sections do not match the draft's blocks, so a published-only render is never
// mistaken for the draft.

import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { getPageToolsClient } from "../studio/scripts/lib/page-tools-client.mjs";
import { validateOverrides } from "./worktree-config.mjs";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export function parseArgs(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--out" || arg === "--only") {
      const value = args[++i];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${arg}.`);
      options[arg.slice(2)] = value;
    } else if (arg.startsWith("--") || options.slug !== undefined) {
      throw new Error(`Unexpected argument: ${arg}`);
    } else options.slug = arg.replace(/^\/+|\/+$/g, "");
  }
  if (!options.slug) throw new Error("Usage: pnpm page:shots <slug> [--out <dir>] [--only desktop|phone]");
  if (options.only && !["desktop", "phone"].includes(options.only)) {
    throw new Error("--only must be desktop or phone.");
  }
  return options;
}

export function assertDraftSections(expected, rendered, draftActive, documentId) {
  if (!draftActive || !rendered.length || JSON.stringify(rendered) !== JSON.stringify(expected)) {
    throw new Error(`Rendered sections do not match draft ${documentId}, or draft mode is off. Refusing screenshots. Expected: ${expected.join(", ")}; rendered: ${rendered.join(", ")}.`);
  }
}

async function main() {
  const { slug, out, only } = parseArgs(process.argv.slice(2));
  const safeSlug = slug.replace(/[^a-zA-Z0-9-]+/g, "_").replace(/^_+|_+$/g, "") || "page";
  const outRoot = path.resolve(out ?? path.join(tmpdir(), "page-shots", safeSlug));
  const client = getPageToolsClient();

  const portsFile = path.join(root, ".worktree-ports.json");
  const ports = existsSync(portsFile)
    ? JSON.parse(readFileSync(portsFile, "utf8"))
    : { frontendPort: 3000, studioPort: 3333 };
  validateOverrides(ports);
  const frontend = `http://127.0.0.1:${ports.frontendPort}`;
  const studio = `http://127.0.0.1:${ports.studioPort}`;

  // Resolve packages the way the frontend does, so pnpm's strict layout works.
  const frontendRequire = createRequire(path.join(root, "frontend", "package.json"));
  const nextSanityRequire = createRequire(frontendRequire.resolve("next-sanity/package.json"));
  const playwrightRequire = createRequire(frontendRequire.resolve("@playwright/test/package.json"));
  const { createPreviewSecret } = await import(
    pathToFileURL(nextSanityRequire.resolve("@sanity/preview-url-secret/create-secret"))
  );
  const playwright = await import(pathToFileURL(playwrightRequire.resolve("playwright")));
  const chromium = playwright.chromium ?? playwright.default.chromium;

  // The draft's own section keys are the proof that the browser shows the draft:
  // the rendered wrappers must carry exactly these keys, in this order.
  const pageDoc = await client
    .withConfig({ perspective: "raw" })
    .fetch(
      `*[_type=="page" && slug.current==$slug && _id in path("drafts.**")][0]{_id, "keys": blocks[]._key}`,
      { slug },
    );
  if (!pageDoc) {
    console.error(`No page draft has the slug "${slug}".`);
    process.exit(1);
  }
  const expectedKeys = pageDoc.keys ?? [];
  if (expectedKeys.length === 0) {
    console.error(`${pageDoc._id} has no Page Builder sections to screenshot.`);
    process.exit(1);
  }

  const { secret } = await createPreviewSecret(client, "page-shots", studio);
  const enableUrl =
    `${frontend}/api/draft-mode/enable?sanity-preview-secret=${encodeURIComponent(secret)}` +
    `&sanity-preview-pathname=${encodeURIComponent(`/${slug}`)}&sanity-preview-perspective=drafts`;

  const viewports = {
    desktop: { width: 1440, height: 1000 },
    phone: { width: 390, height: 844 },
  };

  async function shoot(name, viewport) {
    const out = path.join(outRoot, name);

    const browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await (await browser.newContext({ viewport })).newPage();
    try {
      await page.goto(enableUrl, { waitUntil: "domcontentloaded", timeout: 90_000 });
      await page.waitForSelector("[data-sanity]", { timeout: 90_000 }).catch(() => {
        throw new Error("No draft editing markers rendered. Draft mode may be off; refusing screenshots.");
      });
      const draftActive = (await page.context().cookies()).some((cookie) => cookie.name === "__prerender_bypass");
      // Reveal animations use animation-timeline: view(); pausing them leaves
      // sections at opacity 0, so remove them instead.
      await page.addStyleTag({
        content:
          "*{animation:none!important;transition:none!important;opacity:1!important}" +
          "sanity-visual-editing,nextjs-portal{display:none!important}",
      });
      await page.evaluate(() => {
        document.querySelector("header")?.style.setProperty("display", "none");
        for (const el of document.querySelectorAll("a,button")) {
          if (/Disable Draft Mode/i.test(el.textContent ?? "")) el.style.display = "none";
        }
      });
      // Scroll through once so lazy images load, then wait briefly for them.
      const total = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < total; y += 600) {
        await page.evaluate((v) => window.scrollTo(0, v), y);
        await page.waitForTimeout(100);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(1500);
      await page.evaluate(async () => {
        const pending = [...document.images]
          .filter((img) => !img.complete)
          .map((img) => new Promise((done) => { img.onload = img.onerror = done; }));
        await Promise.race([Promise.all(pending), new Promise((done) => setTimeout(done, 8000))]);
      });

      const sections = await page.evaluate(() => {
        const rows = [];
        for (const el of document.querySelectorAll("[data-sanity]")) {
          const match = el.getAttribute("data-sanity")?.match(/path=blocks:([^.;]+);/);
          if (!match || rows.some((r) => r.key === match[1])) continue;
          el.setAttribute("data-page-shot", String(rows.length));
          rows.push({ key: match[1], height: Math.round(el.getBoundingClientRect().height) });
        }
        return rows;
      });
      const renderedKeys = sections.map((s) => s.key);
      assertDraftSections(expectedKeys, renderedKeys, draftActive, pageDoc._id);
      mkdirSync(out, { recursive: true });
      const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      let index = 0;
      for (const section of sections) {
        index += 1;
        const file = path.join(out, `${String(index).padStart(2, "0")}-${encodeURIComponent(section.key)}.png`);
        await (await page.$(`[data-page-shot="${index - 1}"]`)).screenshot({ path: file });
      }
      console.log(JSON.stringify({ viewport: name, dir: out, pageHeight, sections }));
    } finally {
      await browser.close();
    }
  }

  for (const [name, viewport] of Object.entries(viewports)) {
    if (only && only !== name) continue;
    await shoot(name, viewport);
  }

}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`page:shots: ${error.message}`);
    process.exitCode = 1;
  });
}
