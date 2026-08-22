import {
  getSeoTitleWarnings,
  normalizeSeoTitle,
  resolveSeoTitle,
  stripLegacySeoTitleSuffix,
} from "./seo-title.ts";

export type SeoTitleAuditDocument = {
  _id: string;
  _type: "blogIndex" | "category" | "homePage" | "page" | "post";
  currentSeoTitle?: string | null;
  slug?: string | null;
  title?: string | null;
};

export type SeoTitleAuditRow = {
  contentTitle: string;
  currentSeoTitle: string;
  documentId: string;
  finalRenderedTitle: string;
  group: "human rewrite required" | "no change" | "safe suffix removal";
  length: number;
  proposedPageSpecificTitle: string;
  reason: string;
  route: string;
};

function routeForDocument(document: SeoTitleAuditDocument) {
  if (document._type === "homePage") return "/";
  if (document._type === "blogIndex") return "/blog/";

  const slug = document.slug?.replace(/^\/+|\/+$/g, "");
  if (!slug) return "(missing slug)";
  return document._type === "category"
    ? `/blog/category/${slug}/`
    : `/${slug}/`;
}

export function createSeoTitleAuditRows(
  documents: SeoTitleAuditDocument[],
): SeoTitleAuditRow[] {
  return documents
    .map((document) => {
      const currentSeoTitle = normalizeSeoTitle(document.currentSeoTitle);
      const resolved = resolveSeoTitle({
        fallbackTitle: document.title,
        isHomepage: document._type === "homePage",
        overrideTitle: currentSeoTitle,
      });
      const suffixWasRemoved =
        Boolean(currentSeoTitle) &&
        !currentSeoTitle.includes("|") &&
        stripLegacySeoTitleSuffix(currentSeoTitle) !== currentSeoTitle;
      const warnings = getSeoTitleWarnings({
        fallbackTitle: document.title,
        overrideTitle: currentSeoTitle,
      });
      const reviewWarnings = warnings.filter(
        (warning) => !warning.startsWith("Remove the "),
      );
      const group: SeoTitleAuditRow["group"] = reviewWarnings.length
        ? "human rewrite required"
        : suffixWasRemoved
          ? "safe suffix removal"
          : "no change";
      const reason = reviewWarnings.length
        ? reviewWarnings.join(" ")
        : suffixWasRemoved
          ? "Remove a recognized legacy brand suffix."
          : currentSeoTitle.includes("|")
            ? "Existing complete title is used as written."
          : currentSeoTitle
            ? "Existing page-specific override is already clean."
            : "Use the content title fallback.";

      return {
        contentTitle: normalizeSeoTitle(document.title),
        currentSeoTitle,
        documentId: document._id,
        finalRenderedTitle: resolved.finalTitle,
        group,
        length: resolved.finalTitle.length,
        proposedPageSpecificTitle: resolved.pageTitle,
        reason,
        route: routeForDocument(document),
      };
    })
    .sort((left, right) => left.route.localeCompare(right.route));
}

function csvCell(value: string | number) {
  const text = String(value);
  // Neutralize formula-leading cells so spreadsheets never execute CMS content.
  const protectedText = /^[\t\r ]*[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\n]/.test(protectedText)
    ? `"${protectedText.replaceAll('"', '""')}"`
    : protectedText;
}

export function serializeSeoTitleAuditCsv(rows: SeoTitleAuditRow[]) {
  const headers = [
    "documentId",
    "route",
    "contentTitle",
    "currentSeoTitle",
    "proposedPageSpecificTitle",
    "finalRenderedTitle",
    "length",
    "reason",
    "group",
  ] as const satisfies ReadonlyArray<keyof SeoTitleAuditRow>;

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
  ].join("\n");
}
