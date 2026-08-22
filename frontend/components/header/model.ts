export type HeaderLinkModel = {
  href: string;
  label: string;
  openInNewTab: boolean;
};

export type HeaderChildLinkModel = {
  key: string;
  label: string;
  description: string;
  icon: NavigationIconModel;
  link: HeaderLinkModel;
};

export type HeaderNavigationItem =
  | {
      key: string;
      kind: "link";
      label: string;
      link: HeaderLinkModel;
    }
  | {
      key: string;
      kind: "group";
      label: string;
      links: HeaderChildLinkModel[];
    };

export type HeaderNavigationModel = {
  items: HeaderNavigationItem[];
  actions: Array<{ key: string; link: HeaderLinkModel }>;
};

export type HeaderModel = {
  brand: HeaderBrandModel;
  navigation: HeaderNavigationModel;
};

type RawDestination = { href?: string | null; openInNewTab?: boolean | null };
type RawChildLink = {
  _key?: string | null;
  label?: string | null;
  description?: string | null;
  // name is unknown because the legacy-string GROQ fallback keeps typegen
  // from narrowing it; the mapper only accepts string values at runtime.
  icon?: { name?: unknown; svg?: string | null } | null;
  destination?: RawDestination | null;
};
type RawItem = {
  _key?: string | null;
  kind?: string | null;
  label?: string | null;
  destination?: RawDestination | null;
  links?: RawChildLink[] | null;
};
type RawAction = {
  _key?: string | null;
  label?: string | null;
  destination?: RawDestination | null;
};

export type RawHeaderNavigation = {
  _id?: string | null;
  items?: RawItem[] | null;
  actions?: RawAction[] | null;
} | null;

/** Fallback box, used only when Sanity reports no intrinsic dimensions. */
const FALLBACK_LOGO_WIDTH = 216;
const FALLBACK_LOGO_HEIGHT = 28;

type RawLogoGroup =
  | {
      light?: unknown;
      dark?: unknown;
      width?: number | null;
      height?: number | null;
    }
  | null
  | undefined;

type RawAsset = {
  asset?: { metadata?: { dimensions?: { width?: number; height?: number } } };
};

/**
 * Turn one Sanity image into a next/image source.
 *
 * Dimensions come from the asset's own metadata first, and only fall back to
 * the editable width/height fields. Those fields are a legacy of the single
 * combined lockup: they are easy to leave stale after an asset swap, and a
 * stale pair silently distorts the logo because next/image derives the aspect
 * ratio from them. The intrinsic size is always right for the file in the slot.
 */
function toLogoModel(source: unknown): HeaderLogoModel | null {
  if (!source) return null;

  const dimensions = (source as RawAsset)?.asset?.metadata?.dimensions;
  const width = dimensions?.width ?? FALLBACK_LOGO_WIDTH;
  const height = dimensions?.height ?? FALLBACK_LOGO_HEIGHT;

  return {
    src: urlFor(source as Parameters<typeof urlFor>[0]).url(),
    width,
    height,
  };
}

function createLogoPair(group: RawLogoGroup) {
  return {
    light: toLogoModel(group?.light),
    dark: toLogoModel(group?.dark),
  };
}

export function createHeaderBrandModel(
  settings: SETTINGS_QUERY_RESULT,
): HeaderBrandModel {
  const main = createLogoPair(settings?.logo as RawLogoGroup);
  const secondary = createLogoPair(
    (settings as { secondaryLogo?: RawLogoGroup })?.secondaryLogo,
  );

  return {
    label:
      settings?.siteName?.trim() === SITE_NAME
        ? settings.siteName.trim()
        : SITE_NAME,
    light: main.light,
    dark: main.dark,
    secondary: {
      /*
       * Not the site name: this mark is a separate legal entity, and reusing
       * the site name would have a screen reader announce the same brand twice
       * for two different logos. Kept generic so it survives a change of
       * parent bank, matching the schema field's own naming.
       */
      label: "Parent company",
      light: secondary.light,
      dark: secondary.dark,
    },
  };
}

function normalizeHref(value: string | null | undefined): string | null {
  const href = value?.trim();
  if (!href || href === "#") return null;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(href)) return href;
  if (/^[a-z][a-z\d+.-]*:/i.test(href)) return null;
  const rooted = `/${href.replace(/^\/+/, "")}`;
  return rooted === "/" || rooted.length > 1 ? rooted : null;
}

function normalizeLink(
  label: string | null | undefined,
  destination: RawDestination | null | undefined,
): HeaderLinkModel | null {
  const cleanLabel = label?.trim();
  const href = normalizeHref(destination?.href);
  if (!cleanLabel || !href) return null;
  return {
    href,
    label: cleanLabel,
    openInNewTab: Boolean(destination?.openInNewTab),
  };
}

export function createHeaderNavigationModel(
  raw: RawHeaderNavigation,
): HeaderNavigationModel {
  const items: HeaderNavigationItem[] = [];

  for (const item of raw?.items ?? []) {
    const key = item._key?.trim();
    const label = item.label?.trim();
    if (!key || !label) continue;

    if (item.kind === "link") {
      const link = normalizeLink(label, item.destination);
      if (link) items.push({ key, kind: "link", label, link });
      continue;
    }

    if (item.kind === "group") {
      const links: HeaderChildLinkModel[] = [];
      for (const child of item.links ?? []) {
        const childKey = child._key?.trim();
        const childLabel = child.label?.trim();
        const description = child.description?.trim();
        // stegaClean, not just trim: in draft mode Sanity injects invisible
        // stega characters into every string. The name is a lookup key into
        // the loan-icon map and the svg is injected as markup — the encoded
        // form breaks both. Visible text (label, description) deliberately
        // keeps its encoding so it stays click-to-edit in Presentation.
        const rawIconName = child.icon?.name;
        const iconName =
          typeof rawIconName === "string" ? stegaClean(rawIconName)?.trim() : undefined;
        const iconSvg = stegaClean(child.icon?.svg)?.trim() || null;
        const link = normalizeLink(childLabel, child.destination);
        if (childKey && childLabel && description && iconName && link) {
          links.push({
            key: childKey,
            label: childLabel,
            description,
            icon: { name: iconName, svg: iconSvg },
            link,
          });
        }
      }
      if (links.length > 0) items.push({ key, kind: "group", label, links });
    }
  }

  const actions = (raw?.actions ?? []).flatMap((action) => {
    const key = action._key?.trim();
    const link = normalizeLink(action.label, action.destination);
    return key && link ? [{ key, link }] : [];
  });

  return { items, actions };
}
import { stegaClean } from "next-sanity";
import { urlFor } from "@/sanity/lib/image";
import type { NavigationIconModel } from "./navigation-icon";
import type { SETTINGS_QUERY_RESULT } from "@/sanity.types";

export type HeaderLogoModel = {
  src: string;
  width: number;
  height: number;
};

export type HeaderBrandModel = {
  label: string;
  light: HeaderLogoModel | null;
  dark: HeaderLogoModel | null;
  /**
   * Parent-brand attribution, kept as its own asset rather than baked into the
   * main lockup so the two can be sized independently and can stack on narrow
   * viewports.
   */
  secondary: {
    label: string;
    light: HeaderLogoModel | null;
    dark: HeaderLogoModel | null;
  };
};
import { SITE_NAME } from "../../../shared/seo-title";
