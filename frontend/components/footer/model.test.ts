import { describe, expect, it } from "vitest";
import { createFooterModel, type RawFooter } from "./model";

const rawLink = (key: string, label: string, href: string, openInNewTab = false) => ({
  _key: key,
  label,
  destination: { href, openInNewTab },
});

const rawFooter: RawFooter = {
  _id: "footer",
  brand: {
    phone: rawLink("brand-phone", "602-908-5849", "tel:+16029085849"),
    addressLines: ["3602 E Campbell Ave,", "Phoenix AZ 85018"],
  },
  columns: [
    {
      _key: "resources",
      heading: "Useful Resources",
      links: [
        rawLink("valid", "VA Loan", "phoenix-va-loan"),
        rawLink("invalid", "Broken", "javascript:alert(1)"),
      ],
    },
    {
      _key: "follow",
      heading: "Follow",
      links: [
        rawLink("youtube", "YouTube", "https://youtube.com/example", true),
        rawLink("map", "Google Maps", "https://maps.example.com", true),
      ],
    },
  ],
  contact: {
    heading: "Contact Jimmy",
    fullName: "Jimmy Vercellino",
    nmlsId: "184169",
    phone: rawLink("phone", "480-800-8387", "tel:+14808008387"),
    email: rawLink("email", "jimmy@example.com", "mailto:jimmy@example.com"),
    website: rawLink("website", "phxhomeloan.com", "/"),
  },
  compliance: {
    headline: "Important",
    disclaimer: "Approved disclaimer.",
    nmlsConsumerAccess: rawLink("nmls", "NMLS Consumer Access", "https://nmls.example.com", true),
    equalHousingLabel: "Equal Housing Lender",
    copyrightStartYear: 2019,
    copyrightOwner: "Luminate Bank, Member FDIC",
    organizationNmlsId: "477166",
    organizationPhone: rawLink("org-phone", "1-877-505-1281", "tel:+18775051281"),
    credit: "Website by OVS Websites.",
    legalLinks: [rawLink("privacy", "Privacy Policy", "/privacy")],
  },
};

describe("createFooterModel", () => {
  it("normalizes ordered columns, omits invalid destinations, and retains map links as ordinary links", () => {
    const model = createFooterModel(rawFooter, { siteName: "PHX Home Loan" }, 2026);

    expect(model?.columns).toEqual([
      {
        key: "resources",
        heading: "Useful Resources",
        links: [
      { href: "/phoenix-va-loan", key: "valid", label: "VA Loan", openInNewTab: false },
        ],
      },
      {
        key: "follow",
        heading: "Follow",
        links: [
          { href: "https://youtube.com/example", key: "youtube", label: "YouTube", openInNewTab: true },
          { href: "https://maps.example.com", key: "map", label: "Google Maps", openInNewTab: true },
        ],
      },
    ]);
    expect(model?.contact.email.href).toBe("mailto:jimmy@example.com");
    expect(model?.compliance.copyrightYears).toBe("2019-2026");
  });

  it("keeps valid renamed and reordered columns while discarding empty columns", () => {
    const model = createFooterModel(
      {
        ...rawFooter,
        columns: [
          { _key: "new", heading: "Start Here", links: [rawLink("start", "Get Started", "/start")] },
          { _key: "empty", heading: "Empty", links: [] },
          { _key: "renamed", heading: "Community", links: [rawLink("news", "News", "/news")] },
        ],
      },
      { siteName: "PHX Home Loan" },
      2026,
    );

    expect(model?.columns.map(({ key, heading }) => ({ key, heading }))).toEqual([
      { key: "new", heading: "Start Here" },
      { key: "renamed", heading: "Community" },
    ]);
  });

  it("returns the explicit unavailable outcome for the wrong singleton or missing required data", () => {
    expect(createFooterModel({ ...rawFooter, _id: "another-footer" }, { siteName: "PHX" }, 2026)).toBeNull();
    expect(
      createFooterModel(
        { ...rawFooter, compliance: { ...rawFooter!.compliance, disclaimer: null } },
        { siteName: "PHX" },
        2026,
      ),
    ).toBeNull();
    expect(createFooterModel({ ...rawFooter, columns: [] }, { siteName: "PHX" }, 2026)).toBeNull();
  });
});
