import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import QuickNav from "./quick-nav";

const items = [
  { id: "why-refinance", key: "a", label: "Why refinance" },
  { id: "loan-options", key: "b", label: "Loan options" },
];

function rect(top: number, bottom = top) {
  return {
    bottom,
    height: bottom - top,
    left: 0,
    right: 0,
    toJSON: () => ({}),
    top,
    width: 0,
    x: 0,
    y: top,
  } as DOMRect;
}

describe("QuickNav", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.documentElement.style.removeProperty("--site-header-offset");
  });

  it("follows the live site-header offset", () => {
    render(<QuickNav items={items} />);

    const nav = screen.getByRole("navigation", { name: "On this page" });

    expect(nav).toHaveClass(
      "top-[var(--site-header-offset,var(--header-height))]",
    );
    expect(screen.getByRole("link", { name: "Why refinance" })).toHaveAttribute(
      "href",
      "#why-refinance",
    );
  });

  it("activates the last section that crosses the viewport reading line", () => {
    vi.useFakeTimers();
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(400);
    vi.spyOn(window, "scrollY", "get").mockReturnValue(0);
    let scrollHeight = 400;
    vi.spyOn(document.documentElement, "scrollHeight", "get").mockImplementation(
      () => scrollHeight,
    );
    render(
      <>
        <QuickNav items={items} />
        <section id="why-refinance" />
        <section id="loan-options" />
      </>,
    );

    const whyLink = screen.getByRole("link", { name: "Why refinance" });
    const optionsLink = screen.getByRole("link", { name: "Loan options" });
    const whySection = document.getElementById("why-refinance")!;
    const optionsSection = document.getElementById("loan-options")!;
    let whyTop = 160;
    let optionsTop = 360;

    vi.spyOn(whySection, "getBoundingClientRect").mockImplementation(() => rect(whyTop));
    vi.spyOn(optionsSection, "getBoundingClientRect").mockImplementation(() =>
      rect(optionsTop),
    );

    act(() => vi.runOnlyPendingTimers());
    expect(whyLink).not.toHaveAttribute("aria-current");
    expect(optionsLink).not.toHaveAttribute("aria-current");

    scrollHeight = 1000;
    whyTop = 140;
    fireEvent.scroll(window);
    act(() => vi.runOnlyPendingTimers());
    expect(whyLink).toHaveAttribute("aria-current", "location");
    expect(whyLink).toHaveClass("bg-white", "font-semibold", "text-accent");
    expect(optionsLink).not.toHaveAttribute("aria-current");

    optionsTop = 120;
    fireEvent.scroll(window);
    act(() => vi.runOnlyPendingTimers());
    expect(optionsLink).toHaveAttribute("aria-current", "location");

    optionsTop = 180;
    fireEvent.scroll(window);
    act(() => vi.runOnlyPendingTimers());
    expect(whyLink).toHaveAttribute("aria-current", "location");
    expect(optionsLink).not.toHaveAttribute("aria-current");
  });

  it("activates the final item at the bottom of a short last section", () => {
    vi.useFakeTimers();
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(400);
    let scrollY = 0;
    vi.spyOn(window, "scrollY", "get").mockImplementation(() => scrollY);
    vi.spyOn(document.documentElement, "scrollHeight", "get").mockReturnValue(1000);
    render(
      <>
        <QuickNav items={items} />
        <section id="why-refinance" />
        <section id="loan-options" />
      </>,
    );

    const whyLink = screen.getByRole("link", { name: "Why refinance" });
    const optionsLink = screen.getByRole("link", { name: "Loan options" });
    const whySection = document.getElementById("why-refinance")!;
    const optionsSection = document.getElementById("loan-options")!;

    vi.spyOn(whySection, "getBoundingClientRect").mockImplementation(() => rect(-100));
    vi.spyOn(optionsSection, "getBoundingClientRect").mockImplementation(() => rect(300));

    act(() => vi.runOnlyPendingTimers());
    expect(whyLink).toHaveAttribute("aria-current", "location");

    scrollY = 600;
    fireEvent.scroll(window);
    act(() => vi.runOnlyPendingTimers());
    expect(optionsLink).toHaveAttribute("aria-current", "location");
  });

  it("measures the reading line below the sticky chrome, not the viewport top", () => {
    vi.useFakeTimers();
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(400);
    vi.spyOn(window, "scrollY", "get").mockReturnValue(0);
    vi.spyOn(document.documentElement, "scrollHeight", "get").mockReturnValue(1000);
    render(
      <>
        <QuickNav items={items} />
        <section id="why-refinance" />
        <section id="loan-options" />
      </>,
    );

    const nav = screen.getByRole("navigation", { name: "On this page" });
    // Sticky chrome (site header + nav bar) ends 160px down; the reading line
    // is 35% into the remaining 240px: 160 + 84 = 244.
    vi.spyOn(nav, "getBoundingClientRect").mockImplementation(() => rect(104, 160));
    const whySection = document.getElementById("why-refinance")!;
    // Landed at the top of the visible area, above the old viewport-based
    // line's position (35% of 400 = 140 < 160) — must still count as active.
    vi.spyOn(whySection, "getBoundingClientRect").mockImplementation(() => rect(160));
    vi.spyOn(
      document.getElementById("loan-options")!,
      "getBoundingClientRect",
    ).mockImplementation(() => rect(700));

    act(() => vi.runOnlyPendingTimers());
    expect(screen.getByRole("link", { name: "Why refinance" })).toHaveAttribute(
      "aria-current",
      "location",
    );
  });
});
