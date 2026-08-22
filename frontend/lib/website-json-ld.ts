import { SITE_NAME } from "../../shared/seo-title";

export type WebsiteJsonLd = {
  "@context": "https://schema.org";
  "@type": "WebSite";
  "@id": string;
  name: typeof SITE_NAME;
  url: string;
};

export function createWebsiteJsonLd(siteUrl: string): WebsiteJsonLd {
  const normalizedSiteUrl = siteUrl.replace(/\/$/, "");

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${normalizedSiteUrl}/#website`,
    name: SITE_NAME,
    url: normalizedSiteUrl,
  };
}

export function serializeWebsiteJsonLd(value: WebsiteJsonLd) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
