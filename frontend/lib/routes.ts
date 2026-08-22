export function contentPath(value?: string | null) {
  const slug = value?.replace(/^\/+|\/+$/g, "");
  if (!slug) return "/";
  return `/${slug}/`;
}
