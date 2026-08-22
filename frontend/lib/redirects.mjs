function normalizePath(value) {
  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.includes("\\")) return "";

  const pathOnly = trimmed.split(/[?#]/, 1)[0] ?? "";
  const parts = pathOnly.split("/").filter(Boolean);
  return parts.length === 0 ? "/" : `/${parts.join("/")}`;
}

function withTrailingSlash(value) {
  const normalized = normalizePath(value);
  if (!normalized || normalized === "/") return normalized;
  return `${normalized}/`;
}

function readSlug(value) {
  return typeof value === "string" ? value : value?.current;
}

function getStatusCode(permanent) {
  return permanent === false || permanent === "false" ? 302 : 301;
}

function getSourceVariants(value) {
  const normalized = normalizePath(value);
  if (!normalized) return [];
  return normalized === "/" ? [normalized] : [normalized, `${normalized}/`];
}

/**
 * Convert active Sanity redirect records into explicit Next.js redirect rules.
 * Conflicting sources, chains, cycles, and self-redirects fail the build.
 */
export function compileNextRedirects(records, { reservedSources = [] } = {}) {
  const redirectsBySource = new Map();
  const normalizedReservedSources = new Set(reservedSources.map(normalizePath));

  for (const record of records) {
    if (record.status && record.status !== "active") continue;

    const source = normalizePath(readSlug(record.source));
    const destination = withTrailingSlash(readSlug(record.destination));
    if (!source || !destination) {
      throw new Error("Active redirect is missing a valid internal source or destination");
    }
    if (normalizedReservedSources.has(source)) {
      throw new Error(`Redirect source is reserved by a code-owned rule: ${source}`);
    }
    if (source === normalizePath(destination)) {
      throw new Error(`Redirect source and destination are the same: ${source}`);
    }

    const statusCode = getStatusCode(record.permanent);
    const existing = redirectsBySource.get(source);
    if (existing) {
      if (
        normalizePath(existing.destination) !== normalizePath(destination) ||
        existing.statusCode !== statusCode
      ) {
        throw new Error(`Conflicting redirects share the source ${source}`);
      }
      continue;
    }

    redirectsBySource.set(source, { destination, statusCode });
  }

  for (const [source, redirect] of redirectsBySource) {
    const destination = normalizePath(redirect.destination);
    if (redirectsBySource.has(destination)) {
      throw new Error(`Redirect chain or cycle detected: ${source} -> ${destination}`);
    }
  }

  return [...redirectsBySource].flatMap(([source, redirect]) =>
    getSourceVariants(source).map((sourceVariant) => ({
      source: sourceVariant,
      destination: redirect.destination,
      statusCode: redirect.statusCode,
    })),
  );
}
