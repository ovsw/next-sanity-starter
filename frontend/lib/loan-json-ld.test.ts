import { describe, expect, it } from "vitest";
import {
  createLoanJsonLd,
  serializeLoanJsonLd,
  type CreateLoanJsonLdOptions,
} from "./loan-json-ld";

const baseOptions = {
  loanType: "VA Loan",
  metaDescription: "Arizona VA loan guidance.",
  pageDescription: "Page fallback.",
  slug: "phoenix-va-loan",
  siteUrl: "https://phxhomeloan.com",
} satisfies CreateLoanJsonLdOptions;

function createLoan(overrides: Partial<CreateLoanJsonLdOptions> = {}) {
  return createLoanJsonLd({ ...baseOptions, ...overrides });
}

describe("createLoanJsonLd", () => {
  it("builds a complete LoanOrCredit referencing the Person entity by @id only", () => {
    expect(
      createLoan({
        loanType: "  VA Loan  ",
        slug: "/phoenix-va-loan",
        siteUrl: "https://phxhomeloan.com/",
      }),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "LoanOrCredit",
      name: "VA Loan",
      loanType: "VA Loan",
      description: "Arizona VA loan guidance.",
      url: "https://phxhomeloan.com/phoenix-va-loan/",
      provider: {
        "@id": "https://phxhomeloan.com/#jimmy",
      },
    });
  });

  it("prefers the meta description and falls back to the page description", () => {
    expect(
      createLoan({
        metaDescription: "  Meta description.  ",
        pageDescription: "Page description.",
      }),
    ).toHaveProperty("description", "Meta description.");
    expect(
      createLoan({
        metaDescription: "  ",
        pageDescription: "  Page description.  ",
      }),
    ).toHaveProperty("description", "Page description.");
  });

  it("omits description when both sources are empty", () => {
    const value = createLoan({
      metaDescription: "  ",
      pageDescription: "\n ",
    });

    expect(value).not.toHaveProperty("description");
  });

  it.each([undefined, null, "", "   "])(
    "returns null for an unusable loan type (%j)",
    (loanType) => {
      expect(createLoan({ loanType })).toBeNull();
    },
  );

  it("strips stega characters from the loan type, description, and slug", () => {
    const stega = "\u200b\u200c\u200d\ufeff";

    expect(
      createLoan({
        loanType: `FHA Loan${stega}`,
        metaDescription: `Flexible financing.${stega}`,
        slug: `/${stega}phoenix-fha-loan${stega}/`,
      }),
    ).toMatchObject({
      name: "FHA Loan",
      loanType: "FHA Loan",
      description: "Flexible financing.",
      url: "https://phxhomeloan.com/phoenix-fha-loan/",
    });
  });

  it("normalizes plain and leading-slash stored slugs to the same URL", () => {
    expect(createLoan({ slug: "/phoenix-va-loan" })?.url).toBe(
      createLoan({ slug: "phoenix-va-loan" })?.url,
    );
  });
});

describe("serializeLoanJsonLd", () => {
  it("escapes < and round-trips as valid JSON", () => {
    const value = createLoan({ loanType: "Loan <fast>" });
    expect(value).not.toBeNull();
    if (!value) return;

    const serialized = serializeLoanJsonLd(value);
    expect(serialized).not.toContain("<");
    expect(serialized).toContain("Loan \\u003cfast>");
    expect(JSON.parse(serialized)).toEqual(value);
  });
});
