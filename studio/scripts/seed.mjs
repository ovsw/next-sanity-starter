#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import process from "node:process";
import { createClient } from "@sanity/client";

const directory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(directory, "..", "..");

function parseEnvValue(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const name = trimmed.slice(0, separator).trim();
    if (process.env[name] !== undefined) continue;
    process.env[name] = parseEnvValue(trimmed.slice(separator + 1));
  }
}

loadEnvFile(path.join(rootDirectory, "studio", ".env.local"));

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID;
const DATASET = process.env.SANITY_STUDIO_DATASET;
const API_VERSION = process.env.SANITY_STUDIO_API_VERSION || "2026-03-23";
const TOKEN = process.env.SANITY_AUTH_TOKEN;

export const STARTER_SEED = {
  name: "next-sanity-starter",
  version: 1,
};

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" role="img" aria-label="Neutral workspace placeholder"><rect width="1200" height="800" fill="#f4f1ec"/><rect x="160" y="140" width="880" height="520" rx="24" fill="#ffffff"/><path d="M240 278h420M240 362h720M240 446h540M240 530h320" stroke="#171717" stroke-width="34" stroke-linecap="round"/><circle cx="914" cy="274" r="70" fill="#d6d3cb"/><path d="M824 534c46-90 134-90 180 0" fill="none" stroke="#171717" stroke-width="34" stroke-linecap="round"/></svg>`;
const svgBuffer = Buffer.from(svg);
export const STARTER_IMAGE_ASSET_ID = `image-${createHash("sha1").update(svgBuffer).digest("hex")}-1200x800-svg`;
const imageRef = {
  _type: "image",
  alt: "Neutral placeholder used to test editable image fields.",
  asset: { _type: "reference", _ref: STARTER_IMAGE_ASSET_ID },
};

const ref = (_ref) => ({ _type: "reference", _ref });
const slug = (current) => ({ _type: "slug", current });
const block = (key, text, style = "normal") => ({
  _key: key,
  _type: "block",
  children: [{ _key: `${key}-span`, _type: "span", marks: [], text }],
  markDefs: [],
  style,
});
const simpleText = (key, text) => [block(key, text)];
const internalUrl = (_ref) => ({
  _type: "customUrl",
  type: "internal",
  internal: ref(_ref),
  openInNewTab: false,
});
const button = (key, text, _ref, variant = "default") => ({
  _key: key,
  _type: "button",
  text,
  url: internalUrl(_ref),
  variant,
});
const meta = (title, description) => ({
  title,
  description,
  noindex: false,
  image: imageRef,
});

export const STARTER_DOCUMENT_TYPES = new Map([
  ["settings", "settings"],
  ["navigation", "navigation"],
  ["footer", "footer"],
  ["homePage", "homePage"],
  ["blogIndex", "blogIndex"],
  ["blogPostSettings", "blogPostSettings"],
  ["starter-page-about", "page"],
  ["starter-author-editor", "author"],
  ["starter-category-notes", "category"],
  ["starter-post-field-guide", "post"],
  ["starter-faq-getting-started", "faq"],
  ["starter-team-member-editor", "teamMember"],
  ["starter-testimonial-reader", "testimonial"],
]);

const marker = {
  _starterSeed: STARTER_SEED,
};

export const starterDocuments = [
  {
    _id: "settings",
    _type: "settings",
    ...marker,
    siteName: "Starter Example",
    contact: {
      _type: "contactDetails",
      email: "hello@example.com",
      phone: "+1 555 0100",
      addressLines: ["123 Example Street", "Sample City"],
    },
    socialLinks: [
      { _key: "starter-social", _type: "socialLink", label: "LinkedIn", url: "https://example.com" },
    ],
  },
  {
    _id: "starter-author-editor",
    _type: "author",
    ...marker,
    name: "Example Editor",
    slug: slug("example-editor"),
    image: imageRef,
  },
  {
    _id: "starter-category-notes",
    _type: "category",
    ...marker,
    title: "Field Notes",
    slug: slug("field-notes"),
    description: "Short articles that test category archives and article metadata.",
    meta: meta("Field Notes | Starter Example", "Example category metadata for the Starter seed."),
  },
  {
    _id: "starter-faq-getting-started",
    _type: "faq",
    ...marker,
    title: "What should this sample content prove?",
    body: simpleText("starter-faq-body", "It proves that reusable FAQ entries can be selected and rendered."),
  },
  {
    _id: "starter-team-member-editor",
    _type: "teamMember",
    ...marker,
    name: "Morgan Example",
    role: "Content Editor",
    email: "morgan@example.com",
    phone: "+1 555 0101",
    image: imageRef,
    bio: simpleText("starter-team-bio", "Morgan is a neutral profile used to test team sections."),
    sortOrder: 1,
  },
  {
    _id: "starter-testimonial-reader",
    _type: "testimonial",
    ...marker,
    name: "Example Reader",
    title: "Seed content reviewer",
    image: imageRef,
    body: simpleText("starter-testimonial-body", "The sample content made every editing surface easy to find."),
    rating: 5,
  },
  {
    _id: "starter-page-about",
    _type: "page",
    ...marker,
    title: "About",
    description: "A neutral page used to test routed page rendering.",
    slug: slug("about"),
    blocks: [
      {
        _key: "starter-page-rich-text",
        _type: "richTextBlock",
        eyebrow: "Page",
        title: "A normal routed page",
        richText: [
          block("starter-page-copy", "This page proves normal page routing and rich text rendering."),
          {
            _key: "starter-page-table",
            _type: "table",
            title: "Simple comparison",
            rows: [
              { _key: "starter-table-row-1", _type: "tableRow", cells: ["Field", "Purpose"] },
              { _key: "starter-table-row-2", _type: "tableRow", cells: ["Slug", "/about/"] },
            ],
          },
          { _key: "starter-page-callout", _type: "callout", title: "Callout", body: "This tests the callout object." },
        ],
      },
      {
        _key: "starter-page-cta",
        _type: "ctaBanner",
        title: "Ready for the next example?",
        description: "Return to the home page to inspect the full block set.",
        buttons: [button("starter-page-cta-button", "View home", "homePage")],
      },
    ],
    meta: meta("About | Starter Example", "Example metadata for a normal seeded page."),
  },
  {
    _id: "starter-post-field-guide",
    _type: "post",
    ...marker,
    title: "Starter Field Guide",
    slug: slug("starter-field-guide"),
    excerpt: simpleText("starter-post-excerpt", "A short neutral post that tests article lists, sidebars, and structured data."),
    author: ref("starter-author-editor"),
    publishedAt: "2026-01-15T12:00:00.000Z",
    image: { ...imageRef, caption: "Neutral placeholder image." },
    category: ref("starter-category-notes"),
    body: [
      block("starter-post-intro", "This article proves blog post rendering, author metadata, category links, and the sidebar."),
      block("starter-post-heading", "What it covers", "h2"),
      block("starter-post-body", "It is intentionally short so it can be deleted once real project content exists."),
    ],
    meta: meta("Starter Field Guide | Starter Example", "Example metadata for a seeded blog post."),
  },
  {
    _id: "blogPostSettings",
    _type: "blogPostSettings",
    ...marker,
    title: "Need a next step?",
    description: "Use this shared panel to point readers toward a relevant action.",
    actions: [
      {
        _key: "starter-sidebar-action",
        _type: "blogPostSidebarAction",
        title: "Explore the sample page",
        description: "Confirms internal links from the blog sidebar.",
        button: { _type: "button", text: "Open About", url: internalUrl("starter-page-about") },
      },
    ],
  },
  {
    _id: "blogIndex",
    _type: "blogIndex",
    ...marker,
    title: "Blog",
    description: "Example articles for testing the Starter blog.",
    blocks: [
      {
        _key: "starter-blog-rich-text",
        _type: "richTextBlock",
        eyebrow: "Blog",
        title: "Blog index introduction",
        richText: simpleText("starter-blog-copy", "This block proves the Blog index can carry editable page sections."),
      },
      {
        _key: "starter-blog-latest",
        _type: "latestArticles",
        eyebrow: "Latest",
        title: "Latest posts",
        description: "This section renders the seeded post and category link.",
        fallbackImage: imageRef,
      },
    ],
    meta: meta("Blog | Starter Example", "Example metadata for the seeded Blog index."),
  },
  {
    _id: "homePage",
    _type: "homePage",
    ...marker,
    title: "Starter Example",
    description: "Neutral content that proves the retained Starter model.",
    blocks: [
      {
        _key: "starter-home-hero",
        _type: "hero",
        eyebrow: "Starter seed",
        title: "Neutral sample content for a clean project.",
        body: simpleText("starter-hero-body", "Use this optional seed to inspect the editing model, then remove it before adding real content."),
        buttons: [
          button("starter-hero-primary", "Read the guide", "starter-post-field-guide"),
          button("starter-hero-secondary", "View About", "starter-page-about", "secondary"),
        ],
        image: imageRef,
      },
      {
        _key: "starter-home-benefits",
        _type: "benefitCards",
        eyebrow: "Sections",
        title: "Reusable sections are ready to edit.",
        intro: "These cards prove list rendering and icon-free cards.",
        cards: [
          { _key: "starter-benefit-1", _type: "featureGridItem", title: "Structured pages", body: simpleText("starter-benefit-body-1", "Pages use reusable blocks that can be reordered.") },
          { _key: "starter-benefit-2", _type: "featureGridItem", title: "Reusable references", body: simpleText("starter-benefit-body-2", "FAQ and team sections pull from shared documents.") },
        ],
      },
      {
        _key: "starter-home-story",
        _type: "storyFeature",
        eyebrow: "Image and text",
        title: "A required image field with plain copy.",
        image: imageRef,
        imageCaption: "The seed uses one neutral placeholder asset.",
        richText: [
          block("starter-story-copy", "This section proves image, caption, narrative, details, and buttons."),
          block("starter-story-quote", "Seed content is useful only until real content is ready.", "blockquote"),
        ],
        keyDetails: { _type: "object", title: "Includes", items: ["Image", "Caption", "Details"] },
        buttons: [button("starter-story-button", "Open Blog", "blogIndex")],
      },
      {
        _key: "starter-home-team",
        _type: "teamMembers",
        eyebrow: "People",
        title: "Team member reference",
        richText: simpleText("starter-team-copy", "This section proves selected team profiles."),
        members: [{ _key: "starter-team-ref", ...ref("starter-team-member-editor") }],
      },
      {
        _key: "starter-home-faq",
        _type: "faqAccordion",
        eyebrow: "FAQ",
        title: "Reusable FAQ",
        subtitle: "Selected FAQ documents render here.",
        faqs: [{ _key: "starter-faq-ref", ...ref("starter-faq-getting-started") }],
        link: {
          _type: "object",
          title: "Read the guide",
          description: "Internal link proof.",
          url: internalUrl("starter-post-field-guide"),
        },
      },
      {
        _key: "starter-home-latest",
        _type: "latestArticles",
        eyebrow: "Publishing",
        title: "Latest articles",
        description: "This block proves the seeded post appears in article lists.",
        buttons: [button("starter-latest-button", "Open Blog", "blogIndex", "outline")],
        fallbackImage: imageRef,
      },
      {
        _key: "starter-home-cta",
        _type: "ctaBanner",
        title: "Remove the seed when real content starts.",
        description: "The unseed command removes only marked Starter sample records.",
        buttons: [button("starter-home-cta-button", "Open About", "starter-page-about")],
      },
    ],
    meta: meta("Starter Example | Starter Example", "Neutral Starter seed content for testing page rendering and metadata."),
  },
  {
    _id: "navigation",
    _type: "navigation",
    ...marker,
    items: [
      { _key: "starter-nav-home", _type: "navigationLink", label: "Home", destination: { _type: "navigationDestination", kind: "internal", internal: ref("homePage"), openInNewTab: false } },
      { _key: "starter-nav-about", _type: "navigationLink", label: "About", destination: { _type: "navigationDestination", kind: "internal", internal: ref("starter-page-about"), openInNewTab: false } },
      {
        _key: "starter-nav-resources",
        _type: "navigationGroup",
        label: "Resources",
        links: [
          { _key: "starter-nav-blog", _type: "navigationChildLink", label: "Blog", description: "Article index", destination: { _type: "navigationDestination", kind: "internal", internal: ref("blogIndex"), openInNewTab: false } },
          { _key: "starter-nav-category", _type: "navigationChildLink", label: "Field Notes", description: "Category archive", destination: { _type: "navigationDestination", kind: "internal", internal: ref("starter-category-notes"), openInNewTab: false } },
        ],
      },
    ],
    actions: [
      { _key: "starter-nav-action", _type: "navigationAction", label: "Read guide", destination: { _type: "navigationDestination", kind: "internal", internal: ref("starter-post-field-guide"), openInNewTab: false } },
    ],
  },
  {
    _id: "footer",
    _type: "footer",
    ...marker,
    intro: "Neutral footer copy for the optional Starter seed.",
    columns: [
      {
        _key: "starter-footer-main",
        _type: "footerColumn",
        heading: "Content",
        links: [
          { _key: "starter-footer-home", _type: "footerLink", label: "Home", destination: { _type: "footerDestination", kind: "internal", internal: ref("homePage"), openInNewTab: false } },
          { _key: "starter-footer-blog", _type: "footerLink", label: "Blog", destination: { _type: "footerDestination", kind: "internal", internal: ref("blogIndex"), openInNewTab: false } },
        ],
      },
    ],
    legalLinks: [
      { _key: "starter-footer-privacy", _type: "footerLink", label: "Privacy", destination: { _type: "footerDestination", kind: "external", external: "/privacy", openInNewTab: false } },
    ],
    copyrightStartYear: 2026,
    copyrightOwner: "Starter Example",
  },
];

function requireEnv(name, value) {
  if (!value?.trim()) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export function createSanitySeedClient() {
  return createClient({
    projectId: requireEnv("SANITY_STUDIO_PROJECT_ID", PROJECT_ID),
    dataset: requireEnv("SANITY_STUDIO_DATASET", DATASET),
    apiVersion: API_VERSION,
    token: requireEnv("SANITY_AUTH_TOKEN", TOKEN),
    useCdn: false,
  });
}

async function assertDatasetIsEmpty(client) {
  const count = await client.fetch('count(*[!(_id in path("_.**"))])');
  if (count !== 0) {
    throw new Error(
      `Seed refused: destination dataset is not empty (${count} documents found).`,
    );
  }
}

function assertOwnedDocument(document) {
  const expectedType = STARTER_DOCUMENT_TYPES.get(document?._id);
  if (!expectedType || document._type !== expectedType) return false;
  return (
    document._starterSeed?.name === STARTER_SEED.name &&
    document._starterSeed?.version === STARTER_SEED.version
  );
}

async function getStarterDocuments(client) {
  return client.fetch("*[_id in $ids]{_id,_type,_starterSeed}", {
    ids: [...STARTER_DOCUMENT_TYPES.keys()],
  });
}

async function assertOwnedSeedSet(client) {
  const documents = await getStarterDocuments(client);
  const foundIds = new Set(documents.map((document) => document._id));
  const missing = [...STARTER_DOCUMENT_TYPES.keys()].filter((id) => !foundIds.has(id));
  if (missing.length) {
    throw new Error(`Unseed refused: missing Starter seed documents: ${missing.join(", ")}.`);
  }
  const unsafe = documents.filter((document) => !assertOwnedDocument(document));
  if (unsafe.length) {
    throw new Error(`Unseed refused: these IDs are not marked as Starter seed content: ${unsafe.map((document) => document._id).join(", ")}.`);
  }
}

async function getOwnedAssetIds(client) {
  const ids = await client.fetch(
    "*[_id in $ids && _starterSeed.name == $name].blocks[].image.asset._ref",
    { ids: [...STARTER_DOCUMENT_TYPES.keys()], name: STARTER_SEED.name },
  );
  return [...new Set([STARTER_IMAGE_ASSET_ID, ...ids].filter(Boolean))];
}

export async function seed(client) {
  await assertDatasetIsEmpty(client);
  const asset = await client.assets.upload("image", svgBuffer, {
    filename: "starter-example.svg",
    contentType: "image/svg+xml",
  });
  const documents = JSON.parse(
    JSON.stringify(starterDocuments).replaceAll(
      STARTER_IMAGE_ASSET_ID,
      asset._id,
    ),
  );
  let transaction = client.transaction();
  for (const document of documents) {
    transaction = transaction.createIfNotExists(document);
  }
  await transaction.commit();
  return { documents: documents.length, assetId: asset._id };
}

export async function unseed(client) {
  await assertOwnedSeedSet(client);
  const assetIds = await getOwnedAssetIds(client);
  let transaction = client.transaction();
  for (const id of [...STARTER_DOCUMENT_TYPES.keys(), ...assetIds]) {
    transaction = transaction.delete(id);
  }
  await transaction.commit();
  return { documents: STARTER_DOCUMENT_TYPES.size, assets: assetIds.length };
}

async function main() {
  const command = process.argv[2] ?? "seed";
  const client = createSanitySeedClient();
  if (command === "seed") {
    const result = await seed(client);
    console.log(`Seeded ${result.documents} Starter documents.`);
    return;
  }
  if (command === "unseed") {
    const result = await unseed(client);
    console.log(`Removed ${result.documents} Starter documents and ${result.assets} asset(s).`);
    return;
  }
  throw new Error(`Unknown command: ${command}`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
