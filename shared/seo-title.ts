export const SITE_NAME = "PHX Home Loan";
export const DEFAULT_TITLE_SUFFIX = "The Vercellino Team";
export const TITLE_SUFFIX = ` | ${DEFAULT_TITLE_SUFFIX}`;

const LEGACY_SITE_NAMES = [
  SITE_NAME,
  "Phoenix Mortgage Lenders",
  "Phoenix Mortgage Lender",
  "Phoenix Mortgage",
  "Mortgage Lenders",
  "Mortgage Lender",
  "Phoenix Home Loan",
] as const;

const IMPORTANT_TERMS = ["mortgage", "loan", "lender"] as const;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeSeoTitle(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ") || "";
}

/** Removes only recognized, trailing legacy brand phrases during migration. */
export function stripLegacySeoTitleSuffix(value: string | null | undefined) {
  let title = normalizeSeoTitle(value);
  let previousTitle = "";

  while (title && title !== previousTitle) {
    previousTitle = title;
    for (const siteName of LEGACY_SITE_NAMES) {
      title = title
        .replace(
          new RegExp(`\\s*(?:\\||-)\\s*${escapeRegExp(siteName)}$`, "i"),
          "",
        )
        .trim();
    }
  }

  return title;
}

export function resolveSeoTitle({
  fallbackTitle,
  isHomepage = false,
  overrideTitle,
}: {
  fallbackTitle?: string | null;
  isHomepage?: boolean;
  overrideTitle?: string | null;
}) {
  const normalizedOverride = normalizeSeoTitle(overrideTitle);
  const hasManualSuffix = normalizedOverride.includes("|");
  const pageTitle = hasManualSuffix
    ? normalizedOverride
    : stripLegacySeoTitleSuffix(normalizedOverride) ||
      stripLegacySeoTitleSuffix(fallbackTitle) ||
      SITE_NAME;
  const finalTitle = hasManualSuffix
    ? pageTitle
    : pageTitle.toLowerCase() === SITE_NAME.toLowerCase()
      ? SITE_NAME
      : `${pageTitle}${TITLE_SUFFIX}`;

  return {
    finalTitle,
    // A pipe means the editor supplied the complete title. Absolute titles
    // bypass the layout template so the default suffix is not added twice.
    metadataTitle:
      isHomepage || hasManualSuffix || finalTitle === SITE_NAME
        ? { absolute: finalTitle }
        : pageTitle,
    openGraphTitle: finalTitle,
    pageTitle,
    twitterTitle: finalTitle,
  } as const;
}

export function getSeoTitleWarnings({
  fallbackTitle,
  overrideTitle,
}: {
  fallbackTitle?: string | null;
  overrideTitle?: string | null;
}) {
  const normalizedOverride = normalizeSeoTitle(overrideTitle);
  const { finalTitle, pageTitle } = resolveSeoTitle({
    fallbackTitle,
    overrideTitle,
  });
  const warnings: string[] = [];

  if (
    !normalizedOverride.includes("|") &&
    normalizedOverride &&
    stripLegacySeoTitleSuffix(normalizedOverride) !== normalizedOverride
  ) {
    warnings.push("Remove the manual legacy suffix; the default suffix is automatic.");
  }

  const lowerTitle = pageTitle.toLowerCase();
  const repeatedTerm = IMPORTANT_TERMS.find((term) => {
    const matches = lowerTitle.match(new RegExp(`\\b${term}s?\\b`, "g"));
    return (matches?.length || 0) > 1;
  });
  if (repeatedTerm) {
    warnings.push(`Review the repeated term “${repeatedTerm}” for readability.`);
  }

  if (finalTitle.length > 60) {
    warnings.push(
      `The final ${finalTitle.length}-character title may be shortened in search results.`,
    );
  }

  return warnings;
}
