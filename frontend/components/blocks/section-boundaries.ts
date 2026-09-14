import { cn } from "@/lib/utils";
import { stegaClean } from "next-sanity";

export type SectionTheme = "light" | "dark";
export type SectionBoundary = "outer" | "seam" | "edge";
export type SectionEdgeTreatment = "none" | "wave";
export type SectionSceneProps = {
  theme?: string | null;
  top?: SectionBoundary;
  bottom?: SectionBoundary;
  topTreatment?: SectionEdgeTreatment;
};

export type SectionDescriptor = {
  key: string;
  theme?: string | null;
  kind?: "hero" | "content";
  edgeTreatment?: SectionEdgeTreatment;
};

export type ResolvedSectionBoundary = {
  key: string;
  theme: SectionTheme | null;
  top: SectionBoundary;
  bottom: SectionBoundary;
  topTreatment: SectionEdgeTreatment;
  topTuck: boolean;
};

export function resolveSectionTheme(value: string | null | undefined): SectionTheme {
  return stegaClean(value) === "dark" ? "dark" : "light";
}

export function resolveSectionBoundaries(
  sections: SectionDescriptor[],
): ResolvedSectionBoundary[] {
  return sections.map((section, index) => {
    const previous = sections[index - 1];
    const next = sections[index + 1];
    return {
      key: section.key,
      theme: section.theme == null ? null : resolveSectionTheme(section.theme),
      top: previous ? resolveJoin(previous, section) : "outer",
      bottom: next ? resolveJoin(section, next) : "outer",
      topTreatment: previous
        ? resolveTreatment(previous, section)
        : "none",
      topTuck: Boolean(previous && resolveTreatment(previous, section) !== "none"),
    };
  });
}

function resolveTreatment(
  upper: SectionDescriptor,
  lower: SectionDescriptor,
): SectionEdgeTreatment {
  return resolveJoin(upper, lower) === "edge"
    ? (lower.edgeTreatment ?? "none")
    : "none";
}

function resolveJoin(upper: SectionDescriptor, lower: SectionDescriptor): SectionBoundary {
  if (upper.kind === "hero" || lower.kind === "hero") return "edge";
  if (!upper.theme || !lower.theme) return "edge";
  return resolveSectionTheme(upper.theme) === resolveSectionTheme(lower.theme)
    ? "seam"
    : "edge";
}

export function sectionSceneClassName(
  theme: SectionTheme,
  top: SectionBoundary,
  bottom: SectionBoundary,
  topTreatment: SectionEdgeTreatment = "none",
) {
  return cn(
    "section-scene",
    theme === "dark" ? "section-scene-dark" : "section-scene-light",
    top === "seam" ? "section-scene-seam-top" : "section-scene-edge-top",
    bottom === "seam"
      ? "section-scene-seam-bottom"
      : "section-scene-edge-bottom",
    topTreatment === "wave" ? "section-scene-wave-top" : undefined,
  );
}

export type SectionBand = {
  /** Keys of the sections in the band, in page order. */
  keys: string[];
  theme: SectionTheme | null;
  /** The first section tucks over the section above, so the band's top follows its shape. */
  tuck: boolean;
};

/**
 * Groups consecutive sections joined by seams into bands. Sections in one
 * band share a theme and read as one continuous surface, so the stylesheet
 * paints surface texture once per band instead of once per section. An
 * outer or edge boundary always starts a new band.
 */
export function resolveSectionBands(
  boundaries: ResolvedSectionBoundary[],
): SectionBand[] {
  const bands: SectionBand[] = [];
  for (const boundary of boundaries) {
    const current = bands[bands.length - 1];
    if (current && boundary.top === "seam") {
      current.keys.push(boundary.key);
      continue;
    }
    bands.push({ keys: [boundary.key], theme: boundary.theme, tuck: boundary.topTuck });
  }
  return bands;
}
