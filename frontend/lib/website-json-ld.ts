import { siteName } from "./site-name";

export type WebsiteJsonLd = {
  "@context": "https://schema.org";
  "@type": "WebSite";
  "@id": string;
  name: string;
  url: string;
};

export function createWebsiteJsonLd(siteUrl: string): WebsiteJsonLd {
  const normalizedSiteUrl = siteUrl.replace(/\/$/, "");

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${normalizedSiteUrl}/#website`,
    name: siteName,
    url: normalizedSiteUrl,
  };
}

export function serializeWebsiteJsonLd(value: WebsiteJsonLd) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
