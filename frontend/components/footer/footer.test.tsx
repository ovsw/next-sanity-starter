import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteFooter } from "./site-footer";
import type { FooterModel } from "./model";

const link = (
  key: string,
  label: string,
  href: string,
  openInNewTab = false,
) => ({ key, label, href, openInNewTab });

const model: FooterModel = {
  brand: { label: "Northline", image: null },
  intro: "Clear thinking for complicated work.",
  columns: [
    {
      key: "company",
      heading: "Company",
      links: [link("about", "About", "/about")],
    },
  ],
  contact: {
    email: link(
      "contact-email",
      "hello@example.com",
      "mailto:hello@example.com",
    ),
    phone: link("contact-phone", "+1 555 0100", "tel:+15550100"),
    addressLines: ["10 Main Street", "Example City"],
  },
  socialLinks: [
    link(
      "linkedin",
      "LinkedIn",
      "https://linkedin.com/company/example",
      true,
    ),
  ],
  legalLinks: [link("privacy", "Privacy", "/privacy")],
  copyrightYears: "2024-2026",
  copyrightOwner: "Northline Studio",
};

describe("SiteFooter", () => {
  it("renders authored identity, navigation, contact, and social links", () => {
    render(<SiteFooter model={model} />);
    const footer = screen.getByRole("contentinfo");

    expect(
      within(footer).getByRole("link", { name: "Northline home page" }),
    ).toHaveAttribute("href", "/");
    expect(
      within(footer).getByRole("heading", { name: "Company" }),
    ).toBeInTheDocument();
    expect(within(footer).getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about",
    );
    expect(
      within(footer).getByRole("link", { name: /LinkedIn/ }),
    ).toHaveAttribute("target", "_blank");
    expect(within(footer).getByText("10 Main Street")).toBeInTheDocument();
    expect(document.querySelector('a[href="#"]')).not.toBeInTheDocument();
  });

  it("maps editable footer copy to its Sanity paths", () => {
    const dataAttribute = (path: string) => `field:${path}`;
    render(<SiteFooter dataAttribute={dataAttribute} model={model} />);

    expect(
      document.querySelector('[data-sanity="field:intro"]'),
    ).toHaveTextContent("Clear thinking");
    expect(
      document.querySelector(
        '[data-sanity="field:copyrightStartYear"]',
      ),
    ).toHaveTextContent("2024-2026");
    expect(
      document.querySelector('[data-sanity="field:copyrightOwner"]'),
    ).toHaveTextContent("Northline Studio");
  });
});
