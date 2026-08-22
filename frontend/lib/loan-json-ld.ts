import { stegaClean } from "next-sanity";
import { contentPath } from "@/lib/routes";

export type CreateLoanJsonLdOptions = {
  loanType?: string | null;
  metaDescription?: string | null;
  pageDescription?: string | null;
  slug?: string | null;
  siteUrl: string;
};

export type LoanOrCreditJsonLd = {
  "@context": "https://schema.org";
  "@type": "LoanOrCredit";
  name: string;
  loanType: string;
  description?: string;
  url: string;
  provider: {
    "@id": string;
  };
};

export function createLoanJsonLd({
  loanType,
  metaDescription,
  pageDescription,
  slug,
  siteUrl,
}: CreateLoanJsonLdOptions): LoanOrCreditJsonLd | null {
  const normalizedLoanType = stegaClean(loanType)?.trim();
  if (!normalizedLoanType) return null;

  const description =
    stegaClean(metaDescription)?.trim() ||
    stegaClean(pageDescription)?.trim();
  const normalizedSlug = stegaClean(slug)
    ?.trim()
    .replace(/^\/+|\/+$/g, "")
    .trim();
  const normalizedSiteUrl = siteUrl.replace(/\/$/, "");

  return {
    "@context": "https://schema.org",
    "@type": "LoanOrCredit",
    name: normalizedLoanType,
    loanType: normalizedLoanType,
    ...(description ? { description } : {}),
    url: `${normalizedSiteUrl}${contentPath(normalizedSlug)}`,
    provider: {
      "@id": `${normalizedSiteUrl}/#jimmy`,
    },
  };
}

export function serializeLoanJsonLd(value: LoanOrCreditJsonLd) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
