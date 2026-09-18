import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import Scaffold, { hasScaffoldContent } from "./scaffold";

const paragraph = (key: string, text: string) => ({
  _key: key,
  _type: "block",
  children: [{ _key: `${key}-span`, _type: "span", marks: [], text }],
  markDefs: [],
  style: "normal",
});

function scaffoldProps(overrides: Record<string, unknown> = {}) {
  return {
    _key: "draft",
    _type: "scaffold",
    name: "Pricing overview",
    proposedSectionShape: "Three tier cards with one highlighted plan.",
    richText: [paragraph("draft-body", "Plans start at a flat monthly fee.")],
    ...overrides,
  } as unknown as ComponentProps<typeof Scaffold>;
}

describe("Scaffold section", () => {
  it("renders the rich text with a visible internal marker", () => {
    const { container } = render(<Scaffold {...scaffoldProps()} />);

    const section = container.querySelector("section");
    expect(section).toHaveAttribute("data-scaffold");
    expect(screen.getByText("Pricing overview")).toBeInTheDocument();
    expect(
      screen.getByText("Three tier cards with one highlighted plan."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Plans start at a flat monthly fee."),
    ).toBeInTheDocument();
  });

  it("keeps the marker when the proposed shape is missing", () => {
    render(<Scaffold {...scaffoldProps({ proposedSectionShape: null })} />);

    expect(screen.getByText("Pricing overview")).toBeInTheDocument();
    expect(screen.queryByText(/Proposed shape/)).not.toBeInTheDocument();
  });

  it("renders nothing without a name or content", () => {
    const { container } = render(
      <Scaffold {...scaffoldProps({ name: "  ", richText: [] })} />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(hasScaffoldContent({ name: " ", richText: [] })).toBe(false);
    expect(hasScaffoldContent({ name: "Draft", richText: null })).toBe(true);
  });
});
