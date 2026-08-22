import { createHash } from "node:crypto";

import { getPresentationPath } from "../../presentation/routes.ts";
import {
  CODE_OWNED_GONE_ROUTE_PATHS,
  normalizeRedirectPath,
  readRedirectPath,
  toStoredRedirectPath,
  topologyError,
  type RedirectRecord,
} from "../../schemas/validation/redirect-rules.ts";

/**
 * Derive a stable document id from the redirect source. Function events are
 * delivered at least once, so a redelivered publish must land on the same id
 * instead of creating a second redirect that collides in the topology rules.
 */
export function autoRedirectId(source: string) {
  const digest = createHash("sha256").update(source).digest("hex");
  return `redirect-${digest.slice(0, 24)}`;
}

export type AutoRedirectEventData = {
  beforeSlug?: string;
  documentId?: string;
  documentType?: string;
  slug?: string;
};

type LiveRoute = {
  _id?: string;
  path?: string;
};

export type FetchedRedirect = RedirectRecord & {
  destinationDocument?: {
    _id: string;
    _type: string;
    slug?: string;
  };
};

type AutoRedirectPlan =
  | { action: "skip"; reason: string }
  | {
      action: "apply";
      create: boolean;
      destination: string;
      destinationDocumentId: string;
      retarget: { _id: string; _rev?: string }[];
      source: string;
    };

const ROUTED_DOCUMENT_TYPES = new Set(["page", "post", "category"]);
const RESERVED_SOURCE_PATHS = new Set([
  "/",
  "/blog",
  ...CODE_OWNED_GONE_ROUTE_PATHS,
]);

export function shouldWriteAutoRedirect(local?: boolean) {
  return local !== true;
}

export function resolveFetchedRedirectDestination(
  redirect: FetchedRedirect,
) {
  if (redirect.destinationReference?._ref) {
    if (!redirect.destinationDocument) return undefined;

    return (
      getPresentationPath(
        redirect.destinationDocument._type,
        redirect.destinationDocument.slug,
      ) ?? undefined
    );
  }

  return readRedirectPath(redirect.destination);
}

function isActive(record: RedirectRecord) {
  return !record.status || record.status === "active";
}

export function planAutoRedirect({
  event,
  liveRoutes,
  redirects,
}: {
  event: AutoRedirectEventData;
  liveRoutes: LiveRoute[];
  redirects: RedirectRecord[];
}): AutoRedirectPlan {
  if (!event.documentType || !ROUTED_DOCUMENT_TYPES.has(event.documentType)) {
    return { action: "skip", reason: "Document type is not routed by a slug" };
  }

  const destinationDocumentId = event.documentId?.replace(/^drafts\./, "");
  if (!destinationDocumentId) {
    return { action: "skip", reason: "The publish event has no document id" };
  }

  const source = normalizeRedirectPath(
    getPresentationPath(event.documentType, event.beforeSlug),
  );
  const destination = normalizeRedirectPath(
    getPresentationPath(event.documentType, event.slug),
  );
  if (!source || !destination) {
    return { action: "skip", reason: "The publish event has no previous slug" };
  }
  if (source === destination) {
    return { action: "skip", reason: "The normalized route did not change" };
  }
  if (RESERVED_SOURCE_PATHS.has(source)) {
    return { action: "skip", reason: "The previous route is reserved" };
  }
  if (RESERVED_SOURCE_PATHS.has(destination)) {
    return { action: "skip", reason: "The new route is reserved" };
  }

  const liveCollision = liveRoutes.find((route) => {
    if (
      route._id &&
      event.documentId &&
      route._id.replace(/^drafts\./, "") ===
        event.documentId.replace(/^drafts\./, "")
    ) {
      return false;
    }
    const path = normalizeRedirectPath(route.path);
    return path === source || path === destination;
  });
  if (liveCollision) {
    return {
      action: "skip",
      reason: `Route collision with ${liveCollision._id ?? liveCollision.path}`,
    };
  }

  const sourceRedirect = redirects.find(
    (redirect) =>
      normalizeRedirectPath(readRedirectPath(redirect.source)) === source,
  );
  if (sourceRedirect && !isActive(sourceRedirect)) {
    return {
      action: "skip",
      reason: "An inactive redirect already uses the previous route",
    };
  }

  const activeRedirects = redirects.filter(isActive);
  const directRedirect = sourceRedirect;
  if (
    directRedirect &&
    normalizeRedirectPath(readRedirectPath(directRedirect.destination)) !==
      destination
  ) {
    return { action: "skip", reason: "The previous route already redirects elsewhere" };
  }

  const destinationRedirect = activeRedirects.find(
    (redirect) =>
      normalizeRedirectPath(readRedirectPath(redirect.source)) === destination,
  );
  if (destinationRedirect) {
    return { action: "skip", reason: "The new route is already a redirect source" };
  }

  const incoming = activeRedirects.filter(
    (redirect) =>
      redirect._id &&
      normalizeRedirectPath(readRedirectPath(redirect.destination)) === source &&
      normalizeRedirectPath(readRedirectPath(redirect.source)) !== source,
  );

  const simulated = activeRedirects.map((redirect) =>
    incoming.includes(redirect)
      ? { ...redirect, destination: toStoredRedirectPath(destination) }
      : redirect,
  );
  if (!directRedirect) {
    simulated.push({
      source: toStoredRedirectPath(source),
      destination: toStoredRedirectPath(destination),
      permanent: "true",
      status: "active",
    });
  }

  const error = topologyError(simulated);
  if (error) return { action: "skip", reason: error };

  return {
    action: "apply",
    create: !directRedirect,
    destination: toStoredRedirectPath(destination),
    destinationDocumentId,
    retarget: incoming.map((redirect) => ({
      _id: redirect._id as string,
      _rev: redirect._rev,
    })),
    source: toStoredRedirectPath(source),
  };
}
