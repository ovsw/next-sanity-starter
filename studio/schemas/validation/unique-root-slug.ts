import type { ValidationContext } from "sanity";

type SlugValue = { current?: string };

function normalizeSlug(value: string) {
  return value.trim().replace(/^\/+|\/+$/g, "");
}

export async function uniqueRootSlug(
  value: SlugValue | undefined,
  context: ValidationContext,
) {
  const current = value?.current;
  const documentId = context.document?._id;
  if (!current || !documentId) return true;

  const normalized = normalizeSlug(current);
  const publishedId = documentId.replace(/^drafts\./, "");
  const draftId = `drafts.${publishedId}`;
  const client = context.getClient({ apiVersion: "2026-03-23" });
  const collision = await client.fetch<{
    _id: string;
    _type: "page" | "post";
    slug: string;
  } | null>(
    `*[
      _type in ["page", "post"] &&
      !(_id in [$publishedId, $draftId]) &&
      slug.current in [$plain, $leading, $trailing, $wrapped]
    ][0]{_id, _type, "slug": slug.current}`,
    {
      draftId,
      leading: `/${normalized}`,
      plain: normalized,
      publishedId,
      trailing: `${normalized}/`,
      wrapped: `/${normalized}/`,
    },
  );

  return collision
    ? `This route is already used by a ${collision._type}: ${collision.slug}`
    : true;
}
