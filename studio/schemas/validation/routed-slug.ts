import type { ValidationContext } from "sanity";

import {
  isApplicationPath,
  isRouteSlug,
  routedDocumentPath,
  type RoutedDocumentType,
} from "../../../shared/content-routes.ts";

type SlugValue = { current?: string };

export async function uniqueRoutedSlug(
  value: SlugValue | undefined,
  context: ValidationContext,
) {
  const current = value?.current;
  const documentId = context.document?._id;
  const documentType = context.document?._type;
  if (!current || !documentId) return true;
  if (documentType !== "page" && documentType !== "post") return true;

  if (!isRouteSlug(current)) {
    return "Use lowercase letters, numbers, and single hyphens only";
  }

  const route = routedDocumentPath(documentType, current);
  if (isApplicationPath(route)) {
    return `This slug is reserved by the Website route ${route}`;
  }

  const publishedId = documentId
    .replace(/^drafts\./, "")
    .replace(/^versions\.[^.]+\./, "");
  const client = context
    .getClient({ apiVersion: "2026-03-23" })
    .withConfig({ perspective: "raw" });
  const collision = await client.fetch<{
    _id: string;
    slug: string;
  } | null>(
    `*[
      _type == $documentType &&
      !sanity::versionOf($publishedId) &&
      slug.current in [$slug, "/" + $slug, $slug + "/", "/" + $slug + "/"]
    ][0]{_id, "slug": slug.current}`,
    {
      documentType: documentType satisfies RoutedDocumentType,
      publishedId,
      slug: current,
    },
  );

  return collision
    ? `This route is already used by another ${documentType}: ${collision.slug}`
    : true;
}
