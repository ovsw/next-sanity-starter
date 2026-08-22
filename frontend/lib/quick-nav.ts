import { stegaClean } from "next-sanity";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";

/* Must stay in sync with the hero group in studio/schemas/blocks/page-builder.ts. */
const HERO_BLOCK_TYPES = new Set(["homeHero", "pageHeader"]);

type PageBlock = NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

/* Derived from the generated page query so this input shape can't drift from
   what the GROQ projection actually returns. */
export type QuickNavSourceBlock = Pick<
  PageBlock,
  "_key" | "_type" | "sectionNav"
>;

export type QuickNavItem = {
  id: string;
  key: string;
  label: string;
};

export type QuickNavModel = {
  anchorIdByKey: Record<string, string>;
  heroCount: number;
  items: QuickNavItem[];
  showQuickNav: boolean;
};

function slugify(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * A section appears in the quick nav when it has a nonblank nav label. The nav
 * itself only shows for two or more items — a single-item jump nav is noise.
 */
export function createQuickNavModel(
  blocks: QuickNavSourceBlock[],
  enabled: boolean,
): QuickNavModel {
  let heroCount = 0;
  while (
    heroCount < blocks.length &&
    HERO_BLOCK_TYPES.has(blocks[heroCount]._type)
  ) {
    heroCount += 1;
  }

  const anchorIdByKey: Record<string, string> = {};
  const items: QuickNavItem[] = [];
  const usedIds = new Set<string>();

  for (const block of blocks) {
    const nav = block.sectionNav;
    if (!nav) continue;

    const rawLabel = typeof nav.navLabel === "string" ? nav.navLabel : "";
    const cleanLabel = stegaClean(rawLabel)?.trim();
    if (!cleanLabel) continue;

    const baseId = slugify(cleanLabel) || `section-${items.length + 1}`;
    let id = baseId;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${baseId}-${suffix}`;
      suffix += 1;
    }
    usedIds.add(id);

    anchorIdByKey[block._key] = id;
    /* Keep the raw (stega-encoded) label so Presentation maps the nav text
       back to the section's navLabel field. */
    items.push({ id, key: block._key, label: rawLabel });
  }

  return {
    anchorIdByKey,
    heroCount,
    items,
    showQuickNav: enabled && items.length >= 2,
  };
}
