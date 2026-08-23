import { describe, expect, it } from "vitest";
import {
  getSeoTitleWarnings,
  resolveSeoTitle,
  stripLegacySeoTitleSuffix,
} from "../../shared/seo-title";

const siteName = "Example Company";

describe("resolveSeoTitle", () => {
  it("uses a page override with the configured suffix", () => {
    expect(
      resolveSeoTitle({
        fallbackTitle: "Services",
        overrideTitle: "Custom services",
        siteName,
      }),
    ).toMatchObject({
      finalTitle: "Custom services | Example Company",
      metadataTitle: "Custom services",
      pageTitle: "Custom services",
    });
  });

  it("uses a pipe-bearing override as a complete title", () => {
    expect(
      resolveSeoTitle({ overrideTitle: "About | Example Company", siteName }),
    ).toMatchObject({
      finalTitle: "About | Example Company",
      metadataTitle: { absolute: "About | Example Company" },
    });
  });

  it("returns the configured site name when no page title exists", () => {
    expect(resolveSeoTitle({ siteName }).metadataTitle).toEqual({
      absolute: "Example Company",
    });
  });

  it("removes configured and legacy starter suffixes", () => {
    expect(
      stripLegacySeoTitleSuffix(
        "About | Next.js + Sanity Starter | Example Company",
        siteName,
      ),
    ).toBe("About");
  });
});

describe("getSeoTitleWarnings", () => {
  it("warns about repeated generic terms and long titles", () => {
    const warnings = getSeoTitleWarnings({
      fallbackTitle: "Fallback",
      overrideTitle:
        "Company website services for every company website requirement today",
      siteName,
    });

    expect(warnings).toEqual([
      "Review the repeated term “website” for readability.",
      "The final 86-character title may be shortened in search results.",
    ]);
  });
});
