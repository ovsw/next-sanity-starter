import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Header } from "./site-header";
import type { HeaderModel } from "./model";

const model: HeaderModel = {
  brand: {
    dark: null,
    label: "Northline",
    light: null,
  },
  navigation: {
    items: [
      {
        key: "contact",
        kind: "link",
        label: "Contact",
        link: { href: "/contact", label: "Contact", openInNewTab: false },
      },
      {
        key: "services",
        kind: "group",
        label: "Services",
        links: [
          {
            key: "strategy",
            label: "Strategy",
            description: "Find the clearest path through a hard problem.",
            icon: null,
            link: {
              href: "/strategy",
              label: "Strategy",
              openInNewTab: false,
            },
          },
        ],
      },
    ],
    actions: [
      {
        key: "schedule",
        link: {
          href: "https://example.com/book",
          label: "Start a project",
          openInNewTab: true,
        },
      },
    ],
  },
};

describe("Site Header", () => {
  it("renders authored identity, navigation, and safe actions", () => {
    render(<Header model={model} />);

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Northline home page" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "/contact");
    expect(screen.getByText("Find the clearest path through a hard problem.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Strategy" })).toHaveAttribute("href", "/strategy");

    const action = screen.getByRole("link", { name: "Start a project" });
    expect(action).toHaveAttribute("href", "https://example.com/book");
    expect(action).toHaveAttribute("rel", "noopener noreferrer");
    expect(action).toHaveAttribute("target", "_blank");
    expect(document.querySelector('a[href="#"]')).not.toBeInTheDocument();
  });
});
