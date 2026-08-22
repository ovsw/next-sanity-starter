const PRESENTATION_DOCUMENT_TYPES = new Set([
  "page",
  "post",
  "category",
  "blogIndex",
  "homePage",
]);

function readSlug(document: unknown) {
  if (!document || typeof document !== "object" || !("slug" in document)) {
    return undefined;
  }

  const slug = document.slug;
  if (!slug || typeof slug !== "object" || !("current" in slug)) {
    return undefined;
  }

  return typeof slug.current === "string" ? slug.current : undefined;
}

export function isPresentationDocumentType(documentType: string) {
  return PRESENTATION_DOCUMENT_TYPES.has(documentType);
}

export function resolveContentPath(value?: string | null) {
  const slug = value?.replace(/^\/+|\/+$/g, "");
  if (!slug) return "/";
  return `/${slug}/`;
}

export function resolveCategoryPath(value?: string | null) {
  const slug = value?.trim().replace(/^\/+|\/+$/g, "");
  if (!slug) return null;
  return `/blog/category/${slug}/`;
}

export function getPresentationPath(
  documentType: string,
  slug?: string | null,
) {
  if (documentType === "blogIndex") return "/blog/";
  if (documentType === "homePage") return "/";
  if (!isPresentationDocumentType(documentType) || !slug?.trim()) return null;
  if (documentType === "category") return resolveCategoryPath(slug);
  return resolveContentPath(slug);
}

export function getDocumentSlug(
  draft?: unknown,
  published?: unknown,
) {
  return draft ? readSlug(draft) : readSlug(published);
}
