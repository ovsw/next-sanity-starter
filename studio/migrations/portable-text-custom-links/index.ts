import { at, defineMigration, patch, set } from "sanity/migrate";
import type { Path, SanityDocument } from "sanity";

type JsonRecord = Record<string, unknown>;

export type LegacyLinkAudit = {
  external: number;
  internal: number;
  legacyLinks: number;
  missingDestinations: number;
  referenceIds: string[];
};

export type PortableTextLinkPlan = {
  audit: LegacyLinkAudit;
  issues: string[];
  replacements: Array<{ markDefs: unknown[]; path: Path }>;
};

const legacyLinkKeys = new Set([
  "_key",
  "_type",
  "href",
  "internalLink",
  "isExternal",
  "target",
]);

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function referenceId(value: unknown) {
  return isRecord(value) && typeof value._ref === "string" ? value._ref : null;
}

function isLegacyLink(value: unknown): value is JsonRecord {
  return isRecord(value) && value._type === "link";
}

function auditSimpleFaqBody(document: SanityDocument, issues: string[]) {
  if (document._type !== "faq" || document.body === undefined) return;
  if (!Array.isArray(document.body)) {
    issues.push(`${document._id} body: expected Portable Text blocks`);
    return;
  }

  document.body.forEach((block, blockIndex) => {
    const path = `body.${blockIndex}`;
    if (!isRecord(block) || block._type !== "block") {
      issues.push(`${document._id} ${path}: unsupported embedded content`);
      return;
    }

    if (block.style !== undefined && block.style !== "normal") {
      issues.push(`${document._id} ${path}: unsupported style ${String(block.style)}`);
    }
    if (block.listItem !== undefined || block.level !== undefined) {
      issues.push(`${document._id} ${path}: lists are not supported`);
    }

    const markDefs = Array.isArray(block.markDefs) ? block.markDefs : [];
    const annotationKeys = new Set(
      markDefs.flatMap((mark) =>
        isRecord(mark) && typeof mark._key === "string" ? [mark._key] : [],
      ),
    );

    markDefs.forEach((mark, markIndex) => {
      if (
        !isRecord(mark) ||
        (mark._type !== "link" && mark._type !== "customLink")
      ) {
        issues.push(
          `${document._id} ${path}.markDefs.${markIndex}: unsupported annotation`,
        );
      }
    });

    if (!Array.isArray(block.children)) {
      issues.push(`${document._id} ${path}: expected text spans`);
      return;
    }

    block.children.forEach((child, childIndex) => {
      if (!isRecord(child) || child._type !== "span") {
        issues.push(
          `${document._id} ${path}.children.${childIndex}: unsupported inline content`,
        );
        return;
      }

      const marks = Array.isArray(child.marks) ? child.marks : [];
      const unsupportedMarks = marks.filter(
        (mark) =>
          typeof mark !== "string" ||
          (!annotationKeys.has(mark) && mark !== "strong" && mark !== "em"),
      );
      if (unsupportedMarks.length > 0) {
        issues.push(
          `${document._id} ${path}.children.${childIndex}: unsupported text mark`,
        );
      }
    });
  });
}

function legacyLinkKind(link: JsonRecord) {
  return link.isExternal === true ||
    (typeof link.href === "string" && !isRecord(link.internalLink))
    ? "external"
    : "internal";
}

export function convertLegacyLinkMark(value: unknown) {
  if (!isLegacyLink(value)) return value;

  const kind = legacyLinkKind(value);
  const destination: JsonRecord = {
    _type: "customUrl",
    type: kind,
    openInNewTab: value.target === true,
  };

  if (kind === "external" && typeof value.href === "string") {
    destination.external = value.href;
  }
  if (kind === "internal" && isRecord(value.internalLink)) {
    destination.internal = value.internalLink;
  }

  return {
    ...(typeof value._key === "string" ? { _key: value._key } : {}),
    _type: "customLink",
    customLink: destination,
  };
}

export function planPortableTextLinkMigration(
  document: SanityDocument,
): PortableTextLinkPlan {
  const audit: LegacyLinkAudit = {
    external: 0,
    internal: 0,
    legacyLinks: 0,
    missingDestinations: 0,
    referenceIds: [],
  };
  const issues: string[] = [];
  const replacements: PortableTextLinkPlan["replacements"] = [];

  auditSimpleFaqBody(document, issues);

  function visit(value: unknown, path: Path) {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, [...path, index]));
      return;
    }
    if (!isRecord(value)) return;

    if (value._type === "block" && Array.isArray(value.markDefs)) {
      const legacyLinks = value.markDefs.filter(isLegacyLink);

      if (legacyLinks.length > 0) {
        for (const link of legacyLinks) {
          audit.legacyLinks += 1;
          const kind = legacyLinkKind(link);
          audit[kind] += 1;

          const ref = referenceId(link.internalLink);
          if (ref) audit.referenceIds.push(ref);

          const hasDestination =
            kind === "external"
              ? typeof link.href === "string" && Boolean(link.href.trim())
              : Boolean(ref);
          if (!hasDestination) {
            audit.missingDestinations += 1;
            issues.push(
              `${document._id} ${path.join(".")}: link ${String(link._key ?? "without a key")} has no destination`,
            );
          }

          if (typeof link._key !== "string" || !link._key) {
            issues.push(`${document._id} ${path.join(".")}: link has no _key`);
          }

          const unexpectedKeys = Object.keys(link).filter(
            (key) => !legacyLinkKeys.has(key),
          );
          if (unexpectedKeys.length > 0) {
            issues.push(
              `${document._id} ${path.join(".")}: unexpected link fields ${unexpectedKeys.join(", ")}`,
            );
          }
        }

        replacements.push({
          path: [...path, "markDefs"],
          markDefs: value.markDefs.map(convertLegacyLinkMark),
        });
      }
    }

    for (const [key, child] of Object.entries(value)) {
      if (key !== "markDefs") visit(child, [...path, key]);
    }
  }

  visit(document, []);
  return { audit, issues, replacements };
}

export default defineMigration({
  title: "Use the canonical Portable Text link annotation",
  filter: '!(_type match "sanity.**")',
  async *migrate(documents) {
    const plans: Array<{
      document: SanityDocument;
      plan: PortableTextLinkPlan;
    }> = [];

    for await (const document of documents()) {
      const plan = planPortableTextLinkMigration(document);
      if (plan.replacements.length > 0 || plan.issues.length > 0) {
        plans.push({ document, plan });
      }
    }

    const issues = plans.flatMap(({ plan }) => plan.issues);
    if (issues.length > 0) {
      throw new Error(
        `Aborting before writes: ${issues.length} Portable Text link issue(s)\n${issues.join("\n")}`,
      );
    }

    const audit = plans.reduce<LegacyLinkAudit>(
      (summary, { plan }) => ({
        external: summary.external + plan.audit.external,
        internal: summary.internal + plan.audit.internal,
        legacyLinks: summary.legacyLinks + plan.audit.legacyLinks,
        missingDestinations:
          summary.missingDestinations + plan.audit.missingDestinations,
        referenceIds: [...summary.referenceIds, ...plan.audit.referenceIds],
      }),
      {
        external: 0,
        internal: 0,
        legacyLinks: 0,
        missingDestinations: 0,
        referenceIds: [],
      },
    );

    console.info(
      JSON.stringify({
        documents: plans.length,
        ...audit,
        referenceIds: [...new Set(audit.referenceIds)].sort(),
      }),
    );

    for (const { document, plan } of plans) {
      yield patch(
        document._id,
        plan.replacements.map(({ markDefs, path }) => at(path, set(markDefs))),
        { ifRevision: document._rev },
      );
    }
  },
});
