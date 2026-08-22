import { describe, expect, it } from "vitest";
import {
  getSeoTitleWarnings,
  resolveSeoTitle,
  stripLegacySeoTitleSuffix,
} from "../../shared/seo-title";

describe("resolveSeoTitle", () => {
  it("uses a page-specific override and appends the default suffix", () => {
    expect(
      resolveSeoTitle({
        fallbackTitle: "Conventional Loans",
        overrideTitle: "Phoenix Conventional Mortgage Loan",
      }),
    ).toEqual({
      finalTitle: "Phoenix Conventional Mortgage Loan | The Vercellino Team",
      metadataTitle: "Phoenix Conventional Mortgage Loan",
      openGraphTitle:
        "Phoenix Conventional Mortgage Loan | The Vercellino Team",
      pageTitle: "Phoenix Conventional Mortgage Loan",
      twitterTitle:
        "Phoenix Conventional Mortgage Loan | The Vercellino Team",
    });
  });

  it("falls back to the content title", () => {
    expect(
      resolveSeoTitle({ fallbackTitle: "What Is Earnest Money?" }).pageTitle,
    ).toBe("What Is Earnest Money?");
  });

  it("returns an absolute homepage title", () => {
    expect(
      resolveSeoTitle({
        fallbackTitle: "Phoenix Mortgage Lender",
        isHomepage: true,
      }).metadataTitle,
    ).toEqual({
      absolute: "Phoenix Mortgage Lender | The Vercellino Team",
    });
  });

  it("uses any override containing a pipe as the complete title", () => {
    expect(
      resolveSeoTitle({
        fallbackTitle: "Fallback",
        overrideTitle:
          "My Page Title | The Highly Motivated Vercellino Team",
      }),
    ).toMatchObject({
      finalTitle: "My Page Title | The Highly Motivated Vercellino Team",
      metadataTitle: {
        absolute: "My Page Title | The Highly Motivated Vercellino Team",
      },
      openGraphTitle:
        "My Page Title | The Highly Motivated Vercellino Team",
      twitterTitle:
        "My Page Title | The Highly Motivated Vercellino Team",
    });
  });

  it("does not replace a legacy suffix when the title contains a pipe", () => {
    expect(
      resolveSeoTitle({
        overrideTitle: "FHA Loans | Phoenix Mortgage Lenders",
      }).finalTitle,
    ).toBe("FHA Loans | Phoenix Mortgage Lenders");
  });

  it("does not treat a pipe in the content title as an override", () => {
    expect(
      resolveSeoTitle({
        fallbackTitle: "Fixed vs. Adjustable | Which Is Right?",
      }).finalTitle,
    ).toBe(
      "Fixed vs. Adjustable | Which Is Right? | The Vercellino Team",
    );
  });

  it("falls back when cleaning an override leaves no page title", () => {
    expect(
      resolveSeoTitle({
        fallbackTitle: "Mortgage Guidance",
        overrideTitle: "- PHX Home Loan",
      }).finalTitle,
    ).toBe("Mortgage Guidance | The Vercellino Team");
  });

  it("returns an absolute title when only the site name remains", () => {
    expect(resolveSeoTitle({}).metadataTitle).toEqual({
      absolute: "PHX Home Loan",
    });
  });

  it("removes repeated recognized legacy suffixes", () => {
    expect(
      stripLegacySeoTitleSuffix(
        "FHA Loans | Phoenix Mortgage Lenders | PHX Home Loan",
      ),
    ).toBe("FHA Loans");
  });

  it("removes the legacy Phoenix Mortgage suffix", () => {
    expect(
      stripLegacySeoTitleSuffix(
        "5 Reasons A Mortgage Is Denied After Pre-Approval | Phoenix Mortgage",
      ),
    ).toBe("5 Reasons A Mortgage Is Denied After Pre-Approval");
  });

  it("does not remove ordinary page-specific wording", () => {
    expect(stripLegacySeoTitleSuffix("About PHX Home Loan")).toBe(
      "About PHX Home Loan",
    );
  });
});

describe("getSeoTitleWarnings", () => {
  it("warns when a non-pipe override contains a legacy suffix", () => {
    expect(
      getSeoTitleWarnings({
        fallbackTitle: "Fallback",
        overrideTitle: "FHA Loans - PHX Home Loan",
      }),
    ).toContain(
      "Remove the manual legacy suffix; the default suffix is automatic.",
    );
  });

  it("warns without rejecting manual suffixes, repetition, or length", () => {
    const warnings = getSeoTitleWarnings({
      fallbackTitle: "Fallback",
      overrideTitle:
        "Phoenix Mortgage Options and Mortgage Guidance | PHX Home Loan",
    });

    expect(warnings).toEqual([
      "Review the repeated term “mortgage” for readability.",
      "The final 62-character title may be shortened in search results.",
    ]);
  });
});
