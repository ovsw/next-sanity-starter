import { describe, expect, it } from "vitest";
import {
  createFooterModel,
  type RawFooter,
  type RawFooterSettings,
} from "./model";
import { siteName } from "@/lib/site-name";

const rawLink = (
  key: string,
  label: string,
  href: string,
  openInNewTab = false,
) => ({ _key: key, label, destination: { href, openInNewTab } });

const rawFooter: RawFooter = {
  _id: "footer",
  intro: "Clear thinking for complicated work.",
  columns: [
    {
      _key: "company",
      heading: "Company",
      links: [
        rawLink("about", "About", "about"),
        rawLink("unsafe", "Unsafe", "javascript:alert(1)"),
      ],
    },
  ],
  legalLinks: [rawLink("privacy", "Privacy", "/privacy")],
  copyrightStartYear: 2024,
  copyrightOwner: "Northline Studio",
};

const settings: RawFooterSettings = {
  siteName: "Northline",
  contact: {
    email: "hello@example.com",
    phone: "+1 555 0100",
    addressLines: ["10 Main Street", "Example City"],
  },
  socialLinks: [
    {
      _key: "linkedin",
      label: "LinkedIn",
      url: "https://linkedin.com/company/example",
    },
  ],
};

describe("createFooterModel", () => {
  it("builds a neutral footer from authored settings and safe links", () => {
    const model = createFooterModel(rawFooter, settings, 2026);

    expect(model?.brand.label).toBe("Northline");
    expect(model?.columns[0]?.links).toEqual([
      {
        href: "/about",
        key: "about",
        label: "About",
        openInNewTab: false,
      },
    ]);
    expect(model?.contact.email?.href).toBe("mailto:hello@example.com");
    expect(model?.contact.phone?.href).toBe("tel:+15550100");
    expect(model?.socialLinks[0]?.openInNewTab).toBe(true);
    expect(model?.copyrightYears).toBe("2024-2026");
  });

  it("supports settings documents from before siteName", () => {
    expect(
      createFooterModel(rawFooter, { ...settings, siteName: null }, 2026)
        ?.brand.label,
    ).toBe(siteName);
  });

  it("returns unavailable when settings or required footer data is missing", () => {
    expect(createFooterModel(rawFooter, null, 2026)).toBeNull();
    expect(
      createFooterModel(
        { ...rawFooter, copyrightOwner: null },
        settings,
        2026,
      ),
    ).toBeNull();
  });
});
