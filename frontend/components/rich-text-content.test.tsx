import type { PortableTextProps } from "@portabletext/react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RichTextContent from "./rich-text-content";

function callout(title: string | null, body: string | null) {
  return [
    {
      _key: "callout",
      _type: "callout",
      body,
      title,
    },
  ] as PortableTextProps["value"];
}

describe("RichTextContent", () => {
  it("renders callouts as aside content", () => {
    const { container } = render(
      <RichTextContent value={callout("Important", "Keep this in mind.")} />,
    );

    const aside = container.querySelector("aside");
    expect(aside).toBeInTheDocument();
    expect(screen.getByText("Important")).toBeInTheDocument();
    expect(screen.getByText("Keep this in mind.")).toBeInTheDocument();
  });

  it("renders title-only and body-only callouts", () => {
    const { rerender } = render(
      <RichTextContent value={callout("Important", null)} />,
    );
    expect(screen.getByText("Important")).toBeInTheDocument();

    rerender(<RichTextContent value={callout(null, "Keep this in mind.")} />);
    expect(screen.getByText("Keep this in mind.")).toBeInTheDocument();
  });

  it("skips empty callouts", () => {
    const { container } = render(<RichTextContent value={callout(" ", " ")} />);

    expect(container.querySelector("aside")).not.toBeInTheDocument();
  });
});
