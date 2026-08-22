import { urlFor } from "@/sanity/lib/image";
import { siteName } from "@/lib/site-name";

export type FooterLinkModel = {
  key: string;
  label: string;
  href: string;
  openInNewTab: boolean;
};

export type FooterColumnModel = {
  key: string;
  heading: string;
  links: FooterLinkModel[];
};

export type FooterModel = {
  brand: {
    label: string;
    image: {
      src: string;
      width: number;
      height: number;
    } | null;
  };
  intro: string | null;
  columns: FooterColumnModel[];
  contact: {
    email: FooterLinkModel | null;
    phone: FooterLinkModel | null;
    addressLines: string[];
  };
  socialLinks: FooterLinkModel[];
  legalLinks: FooterLinkModel[];
  copyrightYears: string;
  copyrightOwner: string;
};

type RawDestination = { href?: string | null; openInNewTab?: boolean | null };
type RawLink = {
  _key?: string | null;
  label?: string | null;
  destination?: RawDestination | null;
};

export type RawFooter = {
  _id?: string | null;
  intro?: string | null;
  columns?: Array<{
    _key?: string | null;
    heading?: string | null;
    links?: RawLink[] | null;
  } | null> | null;
  legalLinks?: RawLink[] | null;
  copyrightStartYear?: number | null;
  copyrightOwner?: string | null;
} | null;

export type RawFooterSettings = {
  siteName?: string | null;
  logo?: { light?: unknown; dark?: unknown } | null;
  contact?: {
    email?: string | null;
    phone?: string | null;
    addressLines?: Array<string | null> | null;
  } | null;
  socialLinks?: Array<{
    _key?: string | null;
    label?: string | null;
    url?: string | null;
  } | null> | null;
} | null;

function text(value: string | null | undefined): string | null {
  return value?.trim() || null;
}

function normalizeHref(value: string | null | undefined): string | null {
  const href = text(value);
  if (!href || href === "#") return null;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(href)) return href;
  if (/^[a-z][a-z\d+.-]*:/i.test(href)) return null;
  return `/${href.replace(/^\/+/, "")}`;
}

function link(
  raw: RawLink | null | undefined,
  fallbackKey?: string,
): FooterLinkModel | null {
  const key = text(raw?._key) ?? fallbackKey ?? null;
  const label = text(raw?.label);
  const href = normalizeHref(raw?.destination?.href);
  return key && label && href
    ? {
        key,
        label,
        href,
        openInNewTab: Boolean(raw?.destination?.openInNewTab),
      }
    : null;
}

function links(raw: RawLink[] | null | undefined): FooterLinkModel[] {
  return (raw ?? []).flatMap((item) => {
    const value = link(item);
    return value ? [value] : [];
  });
}

type RawImage = {
  asset?: {
    metadata?: { dimensions?: { width?: number | null; height?: number | null } | null } | null;
  } | null;
};

function logo(settings: RawFooterSettings): FooterModel["brand"]["image"] {
  const source = settings?.logo?.light ?? settings?.logo?.dark;
  if (!source) return null;
  const dimensions = (source as RawImage).asset?.metadata?.dimensions;
  try {
    return {
      src: urlFor(source as Parameters<typeof urlFor>[0]).url(),
      width: dimensions?.width ?? 216,
      height: dimensions?.height ?? 48,
    };
  } catch {
    return null;
  }
}

function contactLink(
  kind: "email" | "phone",
  value: string | null | undefined,
): FooterLinkModel | null {
  const label = text(value);
  if (!label) return null;
  const phone = kind === "phone" ? label.replace(/[^+\d]/g, "") : null;
  if (kind === "phone" && !/\d/.test(phone ?? "")) return null;
  const href = kind === "email" ? `mailto:${label}` : `tel:${phone}`;
  return {
    key: `contact-${kind}`,
    label,
    href,
    openInNewTab: false,
  };
}

export function createFooterModel(
  raw: RawFooter,
  settings: RawFooterSettings,
  currentYear: number,
): FooterModel | null {
  if (!settings) return null;
  const label = settings.siteName?.trim() || siteName;
  const owner = text(raw?.copyrightOwner);
  const startYear = raw?.copyrightStartYear;
  if (
    raw?._id !== "footer" ||
    !label ||
    !owner ||
    !Number.isInteger(startYear) ||
    !Number.isInteger(currentYear)
  ) {
    return null;
  }

  const columns = (raw.columns ?? []).flatMap((column) => {
    const key = text(column?._key);
    const heading = text(column?.heading);
    const columnLinks = links(column?.links);
    return key && heading && columnLinks.length
      ? [{ key, heading, links: columnLinks }]
      : [];
  });
  const socialLinks = (settings.socialLinks ?? []).flatMap((item) => {
    const key = text(item?._key);
    const socialLabel = text(item?.label);
    const href = normalizeHref(item?.url);
    return key && socialLabel && href
      ? [{ key, label: socialLabel, href, openInNewTab: true }]
      : [];
  });
  const addressLines = (settings.contact?.addressLines ?? []).flatMap((line) => {
    const value = text(line);
    return value ? [value] : [];
  });
  const copyrightYears =
    startYear! < currentYear ? `${startYear}-${currentYear}` : `${currentYear}`;

  return {
    brand: { label, image: logo(settings) },
    intro: text(raw.intro),
    columns,
    contact: {
      email: contactLink("email", settings.contact?.email),
      phone: contactLink("phone", settings.contact?.phone),
      addressLines,
    },
    socialLinks,
    legalLinks: links(raw.legalLinks),
    copyrightYears,
    copyrightOwner: owner,
  };
}
