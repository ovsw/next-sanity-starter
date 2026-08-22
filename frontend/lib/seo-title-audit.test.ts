import { describe, expect, it } from "vitest";
import {
  createSeoTitleAuditRows,
  serializeSeoTitleAuditCsv,
} from "../../shared/seo-title-audit";

describe("createSeoTitleAuditRows", () => {
  it("groups safe cleanup, human review, and unchanged fallbacks", () => {
    const rows = createSeoTitleAuditRows([
      {
        _id: "homePage",
        _type: "homePage",
        currentSeoTitle: "Phoenix Mortgage Lender - PHX Home Loan",
        title: "Home",
      },
      {
        _id: "page-1",
        _type: "page",
        currentSeoTitle:
          "Phoenix Mortgage Options and Mortgage Guidance | PHX Home Loan",
        slug: "mortgage-options",
        title: "Mortgage Options",
      },
      {
        _id: "post-1",
        _type: "post",
        currentSeoTitle: null,
        slug: "earnest-money",
        title: "What Is Earnest Money?",
      },
    ]);

    expect(rows.map(({ group, route }) => ({ group, route }))).toEqual([
      { group: "safe suffix removal", route: "/" },
      { group: "no change", route: "/earnest-money/" },
      { group: "human rewrite required", route: "/mortgage-options/" },
    ]);
  });

  it("serializes every required audit column", () => {
    const [row] = createSeoTitleAuditRows([
      {
        _id: "category-1",
        _type: "category",
        slug: "loan-types",
        title: "Loan Types",
      },
    ]);
    const csv = serializeSeoTitleAuditCsv([row]);

    expect(csv.split("\n")[0]).toBe(
      "documentId,route,contentTitle,currentSeoTitle,proposedPageSpecificTitle,finalRenderedTitle,length,reason,group",
    );
    expect(csv).toContain("/blog/category/loan-types/");
  });

  it("neutralizes formula-leading cells in the CSV export", () => {
    const [row] = createSeoTitleAuditRows([
      {
        _id: "page-1",
        _type: "page",
        currentSeoTitle: "=HYPERLINK(\"https://evil.example\")",
        slug: "injected",
        title: "@SUM(A1)",
      },
    ]);
    const csv = serializeSeoTitleAuditCsv([row]);

    expect(csv).toContain("\"'=HYPERLINK(\"\"https://evil.example\"\")\"");
    expect(csv).toContain("'@SUM(A1)");
    expect(csv).not.toMatch(/(^|,)=HYPERLINK/m);
  });

  it("preserves a pipe-bearing legacy title for manual review", () => {
    const [row] = createSeoTitleAuditRows([
      {
        _id: "post-1",
        _type: "post",
        currentSeoTitle:
          "5 Reasons A Mortgage Is Denied After Pre-Approval | Phoenix Mortgage",
        slug: "reasons-mortgage-rejection-pre-approval",
        title: "The 5 Reasons for Mortgage Rejection After Pre-Approval",
      },
    ]);

    expect(row).toMatchObject({
      finalRenderedTitle:
        "5 Reasons A Mortgage Is Denied After Pre-Approval | Phoenix Mortgage",
      group: "human rewrite required",
      length: 68,
      proposedPageSpecificTitle:
        "5 Reasons A Mortgage Is Denied After Pre-Approval | Phoenix Mortgage",
      reason:
        "Review the repeated term “mortgage” for readability. The final 68-character title may be shortened in search results.",
    });
  });
});
