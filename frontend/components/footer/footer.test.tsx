import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SiteFooter } from "./site-footer";
import { createFooterModel, type FooterModel } from "./model";
import { CachedFooter } from "./index";
import { fetchSanityFooter, fetchSanitySettings, getCurrentYear } from "@/sanity/lib/fetch";

vi.mock("@/sanity/lib/fetch", () => ({
  fetchSanityFooter: vi.fn(),
  fetchSanitySettings: vi.fn(),
  getCurrentYear: vi.fn(),
}));

vi.mock("@/sanity/lib/live", () => ({}));

vi.mock("./model", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./model")>()),
  createFooterModel: vi.fn(),
}));

const link = (key: string, label: string, href: string, openInNewTab = false) => ({
  key,
  label,
  href,
  openInNewTab,
});

const model: FooterModel = {
  brand: {
    label: "PHX Home Loan",
    image: null,
    secondaryImage: null,
    phone: link("brand-phone", "602-908-5849", "tel:+16029085849"),
    addressLines: ["3602 E Campbell Ave,", "Phoenix AZ 85018"],
    organizationNmlsId: "477166",
  },
  columns: [
    {
      key: "resources",
      heading: "Useful Resources",
      links: [link("c2p", "Construction-to-Permanent Loan", "/construction-to-permanent-loan/")],
    },
    {
      key: "follow",
      heading: "Follow",
      links: [
        link("youtube", "YouTube", "https://youtube.com", true),
        link("map", "Google Maps", "https://maps.example.com", true),
      ],
    },
  ],
  contact: {
    heading: "Contact Jimmy",
    fullName: "Jimmy Vercellino",
    nmlsId: "184169",
    phone: link("jimmy-phone", "480-800-8387", "tel:+14808008387"),
    email: link("email", "jimmy.vercellino@goluminate.com", "mailto:jimmy.vercellino@goluminate.com"),
    website: link("website", "phxhomeloan.com", "/"),
  },
  compliance: {
    headline: "Important",
    disclaimer: "Approved mortgage disclaimer. Equal Housing Lender.",
    nmlsConsumerAccess: link("nmls", "NMLS Consumer Access", "https://nmls.example.com", true),
    equalHousingLabel: "Equal Housing Lender",
    copyrightYears: "2019-2026",
    copyrightOwner: "Luminate Bank, Member FDIC",
    organizationNmlsId: "477166",
    organizationPhone: link("org-phone", "1-877-505-1281", "tel:+18775051281"),
    credit: "Website by OVS Websites.",
    legalLinks: [link("privacy", "Privacy Policy", "/privacy")],
  },
};

describe("Site Footer", () => {
  it("renders the complete semantic footer contract with authored labels", () => {
    render(<SiteFooter model={model} />);

    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByRole("heading", { name: "Site footer" })).toBeInTheDocument();
    expect(within(footer).getByRole("heading", { name: "Useful Resources" })).toBeInTheDocument();
    expect(within(footer).getByRole("heading", { name: "Contact Jimmy" })).toBeInTheDocument();
    expect(within(footer).getByRole("heading", { name: "Follow" })).toBeInTheDocument();
    expect(within(footer).getByRole("heading", { name: "Important" })).toBeInTheDocument();
    expect(within(footer).getByRole("link", { name: "Home page" })).toHaveAttribute("href", "/");
    expect(within(footer).getByRole("link", { name: "Construction-to-Permanent Loan" })).toHaveAttribute(
      "href",
      "/construction-to-permanent-loan",
    );
    expect(
      within(footer).getByText("Approved mortgage disclaimer. Equal Housing Lender."),
    ).toBeInTheDocument();
    const equalHousingLogo = footer.querySelector('img[src*="equal-housing-lender.png"]');
    expect(equalHousingLogo).toHaveAttribute("alt", "");
    expect(equalHousingLogo?.closest("a")).toBeNull();
    expect(
      within(footer).getByText(
        (_, element) =>
          element?.tagName === "P" && element.textContent?.includes("2019-2026 Luminate Bank"),
      ),
    ).toBeInTheDocument();
    expect(document.querySelector('a[href="#"]')).not.toBeInTheDocument();
  });

  it("maps each editable compliance-line field to its Sanity source path", () => {
    const dataAttribute = (path: string) => `field:${path}`;

    render(<SiteFooter dataAttribute={dataAttribute} model={model} />);

    const field = (path: string) => document.querySelector(`[data-sanity="field:${path}"]`);

    expect(field("compliance.copyrightStartYear")).toHaveTextContent("2019-2026");
    expect(field("compliance.copyrightOwner")).toHaveTextContent("Luminate Bank, Member FDIC");
    expect(field("compliance.organizationNmlsId")).toHaveTextContent("477166");
    expect(field("compliance.organizationPhone")).toHaveTextContent("1-877-505-1281");
    expect(field("compliance.organizationPhone")).toHaveAttribute("href", "tel:+18775051281");
    expect(field("compliance.credit")).toHaveTextContent("Website by OVS Websites.");
  });

  it("adds footer field annotations only for stega previews", async () => {
    vi.mocked(fetchSanityFooter).mockResolvedValue(null as never);
    vi.mocked(fetchSanitySettings).mockResolvedValue(null as never);
    vi.mocked(getCurrentYear).mockResolvedValue(2026);
    vi.mocked(createFooterModel).mockReturnValue(model);

    const { rerender } = render(await CachedFooter({ perspective: "drafts", stega: true }));
    expect(screen.getByText("2019-2026")).toHaveAttribute("data-sanity");
    expect(screen.getByRole("link", { name: "1-877-505-1281" })).toHaveAttribute("data-sanity");

    rerender(await CachedFooter({ perspective: "published", stega: false }));
    expect(screen.getByText("2019-2026")).not.toHaveAttribute("data-sanity");
    expect(screen.getByRole("link", { name: "1-877-505-1281" })).not.toHaveAttribute("data-sanity");
  });

  it("uses safe configured target behavior for external destinations", () => {
    render(<SiteFooter model={model} />);

    for (const name of ["YouTube", "Google Maps"]) {
      const external = screen.getByRole("link", { name });
      expect(external).toHaveAttribute("target", "_blank");
      expect(external).toHaveAttribute("rel", "noopener noreferrer");
    }
    const nmlsConsumerAccess = screen.getByRole("link", {
      name: /^NMLS Consumer Access\s*\(opens in a new tab\)$/,
    });
    expect(nmlsConsumerAccess).toHaveAttribute("target", "_blank");
    expect(nmlsConsumerAccess).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("link", { name: "Privacy Policy" })).not.toHaveAttribute("target");
  });

  it("renders authored columns in order around Contact without heading-specific behavior", () => {
    const flexibleModel: FooterModel = {
      ...model,
      columns: [
        { key: "community", heading: "Community", links: [link("news", "News", "/news")] },
        { key: "help", heading: "Get Help", links: [link("faq", "FAQs", "/faqs")] },
        { key: "more", heading: "More", links: [link("map", "Google Maps", "https://maps.example.com", true)] },
      ],
    };

    render(<SiteFooter model={flexibleModel} />);

    const headings = within(screen.getByRole("contentinfo"))
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);
    expect(headings).toEqual([
      "PHX Home Loan",
      "Community",
      "Contact Jimmy",
      "Get Help",
      "More",
      "Important",
    ]);
    expect(screen.getByRole("link", { name: "Google Maps" })).toHaveAttribute(
      "href",
      "https://maps.example.com",
    );
  });
});
