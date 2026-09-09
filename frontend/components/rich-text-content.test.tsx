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
  it("renders quote blocks as semantic blockquotes", () => {
    render(<RichTextContent value={[{
      _key: "quote", _type: "block", style: "blockquote", markDefs: [],
      children: [{ _key: "text", _type: "span", marks: [], text: "A useful quotation." }],
    }]} />);
    expect(screen.getByText("A useful quotation.").tagName).toBe("BLOCKQUOTE");
  });

  it("bounds rich-text image requests and preserves image descriptions", () => {
    render(<RichTextContent value={[{
      _key: "image", _type: "image", alt: "A mountain", caption: "At sunrise",
      resolvedAsset: {
        _id: "image-abc123-2400x1800-jpg",
        url: "https://cdn.sanity.io/images/test-project/test/abc123-2400x1800.jpg",
        metadata: { dimensions: { width: 2400, height: 1800 } },
      },
    }]} />);
    const source = screen.getByRole("img", { name: "A mountain" }).getAttribute("src") || "";
    const optimizedUrl = new URL(source, "https://example.test");
    const assetUrl = new URL(optimizedUrl.searchParams.get("url") || source);
    expect(assetUrl.searchParams.get("w")).toBe("1600");
    expect(assetUrl.searchParams.get("fit")).toBe("max");
    expect(screen.getByText("At sunrise")).toBeInTheDocument();
  });

  it("preserves SVG format in bounded rich-text image requests", () => {
    render(<RichTextContent value={[{
      _key: "svg", _type: "image", alt: "A diagram",
      resolvedAsset: {
        _id: "image-abc123-2400x1800-svg",
        url: "https://cdn.sanity.io/images/test-project/test/abc123-2400x1800.svg",
        mimeType: "image/svg+xml",
        metadata: { dimensions: { width: 2400, height: 1800 } },
      },
    }]} />);
    const source = screen.getByRole("img", { name: "A diagram" }).getAttribute("src") || "";
    const optimizedUrl = new URL(source, "https://example.test");
    const assetUrl = new URL(optimizedUrl.searchParams.get("url") || source);
    expect(assetUrl.pathname).toMatch(/\.svg$/);
    expect(assetUrl.searchParams.has("fm")).toBe(false);
    expect(assetUrl.searchParams.get("w")).toBe("1600");
    expect(assetUrl.searchParams.get("fit")).toBe("max");
  });

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
