import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Header } from "./site-header";
import type { HeaderModel, HeaderNavigationModel } from "./model";
import { SITE_HEADER_OFFSET_PROPERTY } from "./site-header-shell";

const testSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 22h18"></path></svg>';

const navigation: HeaderNavigationModel = {
  items: [
    {
      key: "contact",
      kind: "link",
      label: "Contact",
      link: { href: "/contact", label: "Contact", openInNewTab: false },
    },
    {
      key: "loans",
      kind: "group",
      label: "Loan Types",
      links: [
        {
          key: "va",
          label: "VA Loan",
          description: "Benefits for eligible service members.",
          icon: { name: "shield-check", svg: testSvg },
          link: {
            href: "/phoenix-va-loan",
            label: "VA Loan",
            openInNewTab: false,
          },
        },
      ],
    },
    {
      key: "resources",
      kind: "group",
      label: "Resources",
      links: [
        {
          key: "calculator",
          label: "Payment Calculator",
          description: "Estimate a monthly payment.",
          icon: { name: "home", svg: testSvg },
          link: {
            href: "/calculator",
            label: "Payment Calculator",
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
        label: "Schedule Consult",
        openInNewTab: true,
      },
    },
  ],
};

const model: HeaderModel = {
  brand: {
    dark: null,
    label: "PHX Home Loan",
    light: null,
    secondary: { dark: null, label: "Parent company", light: null },
  },
  navigation,
};

describe("Site Header", () => {
  it("renders branding, navigation hierarchy, and safe actions", async () => {
    const user = userEvent.setup();
    render(<Header model={model} />);

    expect(screen.getByRole("banner")).toBeInTheDocument();
    // The site ships light-theme-only (docs/adr/0001), so the header must not
    // regain a theme toggle. Its accessible name comes from menu-toggle.tsx.
    expect(
      screen.queryByRole("button", { name: "Toggle theme" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("navigation", { name: "Main navigation" })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: "Contact" })[0]).toHaveAttribute("href", "/contact");
    await user.click(screen.getByRole("button", { name: "Loan Types" }));
    expect(screen.getByText("Benefits for eligible service members.")).toBeInTheDocument();
    const action = screen.getAllByRole("link", { name: "Schedule Consult" })[0];
    expect(action).toHaveAttribute("href", "https://example.com/book");
    expect(action).toHaveAttribute("rel", "noopener noreferrer");
    expect(action).toHaveAttribute("target", "_blank");
    expect(document.querySelector('a[href="#"]')).not.toBeInTheDocument();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("operates a desktop disclosure with Enter and Escape and restores focus", async () => {
    const user = userEvent.setup();
    render(<Header model={model} />);
    const trigger = screen.getByRole("button", { name: "Loan Types" });

    trigger.focus();
    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /^VA Loan/ })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("shares one follow-along panel when moving between group triggers", async () => {
    const user = userEvent.setup();
    render(<Header model={model} />);
    const loans = screen.getByRole("button", { name: "Loan Types" });
    const resources = screen.getByRole("button", { name: "Resources" });

    await user.hover(loans);
    expect(loans).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Benefits for eligible service members.")).toBeInTheDocument();

    // Moving to a sibling trigger reuses the same panel rather than opening a second one.
    await user.hover(resources);
    await waitFor(() => expect(resources).toHaveAttribute("aria-expanded", "true"));
    expect(loans).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(screen.getByText("Estimate a monthly payment.")).toBeInTheDocument());
    expect(screen.queryByText("Benefits for eligible service members.")).not.toBeInTheDocument();
  });

  it("closes the follow-along panel when the pointer leaves the navigation", async () => {
    const user = userEvent.setup();
    render(<Header model={model} />);
    const trigger = screen.getByRole("button", { name: "Loan Types" });

    await user.hover(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.unhover(trigger);
    await user.hover(screen.getByRole("link", { name: "Home page" }));
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
    await waitFor(() =>
      expect(screen.queryByText("Benefits for eligible service members.")).not.toBeInTheDocument(),
    );
  });

  it("keeps a single main navigation landmark with only one open group at a time", async () => {
    const user = userEvent.setup();
    render(<Header model={model} />);

    await user.click(screen.getByRole("button", { name: "Loan Types" }));
    await user.click(screen.getByRole("button", { name: "Resources" }));

    const expanded = screen
      .getAllByRole("button", { expanded: true })
      .filter((button) => button.textContent?.trim());
    expect(expanded).toHaveLength(1);
    expect(expanded[0]).toHaveTextContent("Resources");
  });

  it("still opens and closes groups when reduced motion is requested", async () => {
    const matchMedia = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: (query: string) => ({
        ...matchMedia(query),
        matches: query.includes("prefers-reduced-motion"),
        media: query,
      }),
    });

    try {
      const user = userEvent.setup();
      render(<Header model={model} />);
      const trigger = screen.getByRole("button", { name: "Loan Types" });

      await user.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByText("Benefits for eligible service members.")).toBeInTheDocument();

      await user.keyboard("{Escape}");
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      await waitFor(() =>
        expect(screen.queryByText("Benefits for eligible service members.")).not.toBeInTheDocument(),
      );
    } finally {
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: matchMedia,
      });
    }
  });

  it("opens the mobile Sheet and closes it after navigation", async () => {
    const user = userEvent.setup();
    render(<Header model={model} />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("dialog", { name: "Main navigation" })).toBeInTheDocument();
    await user.click(screen.getAllByRole("link", { name: "Contact" }).at(-1)!);
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Main navigation" })).not.toBeInTheDocument(),
    );
  });

  it("hides on meaningful downward scroll and reveals on upward scroll or focus", () => {
    vi.useFakeTimers();
    try {
      render(<Header model={model} />);
      const banner = screen.getByRole("banner");
      // The header defers its scroll handler through requestAnimationFrame,
      // which the test setup schedules as a macrotask.
      const scrollTo = (value: number) => {
        Object.defineProperty(window, "scrollY", { configurable: true, value });
        fireEvent.scroll(window);
        act(() => {
          vi.runOnlyPendingTimers();
        });
      };

      expect(document.documentElement.style.getPropertyValue(SITE_HEADER_OFFSET_PROPERTY)).toBe(
        "var(--header-height)",
      );

      scrollTo(200);
      expect(banner).toHaveAttribute("data-visible", "false");
      expect(document.documentElement.style.getPropertyValue(SITE_HEADER_OFFSET_PROPERTY)).toBe(
        "0px",
      );

      scrollTo(150);
      expect(banner).toHaveAttribute("data-visible", "true");

      scrollTo(300);
      expect(banner).toHaveAttribute("data-visible", "false");

      fireEvent.focus(screen.getByRole("link", { name: "Home page" }));
      expect(banner).toHaveAttribute("data-visible", "true");
    } finally {
      vi.useRealTimers();
    }
  });
});
