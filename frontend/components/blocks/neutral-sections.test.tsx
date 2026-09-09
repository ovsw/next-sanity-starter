import { render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import Testimonials from "./testimonials";
import StackedFeatureRows from "./stacked-feature-rows";
import StackedTimeline from "./stacked-timeline";

const paragraph = (text: string) => [
  {
    _key: "body",
    _type: "block",
    style: "normal",
    markDefs: [],
    children: [{ _key: "text", _type: "span", text, marks: [] }],
  },
];

describe("neutral Page Builder sections", () => {
  it("renders ordered, attributed quotes and skips unresolved or empty references", () => {
    const props = {
      _key: "quotes",
      _type: "testimonials",
      title: "What people say",
      useAlternateBackground: true,
      testimonials: [
        { _key: "missing", document: null },
        {
          _key: "empty",
          document: { _id: "empty", name: "Empty quote", body: paragraph(" ") },
        },
        {
          _key: "first",
          document: {
            _id: "avery",
            name: "Avery",
            title: "Client",
            body: paragraph("Clear and useful."),
            rating: 4.5,
          },
        },
        {
          _key: "second",
          document: {
            _id: "sam",
            name: "Sam",
            body: paragraph("A thoughtful result."),
          },
        },
      ],
    } as unknown as ComponentProps<typeof Testimonials>;
    const { container } = render(
      <Testimonials
        {...props}
        testimonialDataAttribute={(id, path) => `${id}:${path}`}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "What people say" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "What people say" })).toHaveAttribute("data-alternate", "true");
    expect(
      screen.getByRole("region", { name: "Customer quotes" }),
    ).toHaveAttribute("tabindex", "0");
    const quotes = container.querySelectorAll("blockquote");
    expect(quotes).toHaveLength(2);
    expect(quotes[0]).toHaveTextContent("Clear and useful.");
    expect(quotes[0]).toHaveAttribute("data-sanity", "avery:body");
    expect(quotes[1]).toHaveTextContent("A thoughtful result.");
    expect(screen.getByText("Avery")).toHaveAttribute(
      "data-sanity",
      "avery:name",
    );
    expect(screen.getByLabelText("Rated 4.5 out of 5")).toBeInTheDocument();
    expect(screen.queryByText("Empty quote")).not.toBeInTheDocument();
  });

  it("does not render an empty testimonial section", () => {
    const props = {
      _key: "empty",
      _type: "testimonials",
      title: "Quotes",
      testimonials: [],
    } as unknown as ComponentProps<typeof Testimonials>;
    const { container } = render(<Testimonials {...props} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("keeps rows without links and rejects unsafe or incomplete optional links", () => {
    const props = {
      _key: "features",
      _type: "stackedFeatureRows",
      title: "Features",
      rows: [
        {
          _key: "plain",
          title: "No action needed",
          items: [{ _key: "point", body: paragraph("Useful context.") }],
        },
        {
          _key: "safe",
          title: "Explore",
          items: [{ _key: "point", body: paragraph("Read more.") }],
          link: { text: "Details", href: "/details", openInNewTab: true },
        },
        {
          _key: "unsafe",
          title: "Safe content",
          items: [{ _key: "point", body: paragraph("Still visible.") }],
          link: { text: "Unsafe", href: "javascript:alert(1)" },
        },
        {
          _key: "partial",
          title: "Partial link",
          items: [{ _key: "point", body: paragraph("Also visible.") }],
          link: { text: "Missing destination" },
        },
      ],
    } as unknown as ComponentProps<typeof StackedFeatureRows>;
    render(<StackedFeatureRows {...props} />);
    expect(
      screen.getByRole("heading", { name: "No action needed" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Still visible.")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Details" })).toHaveAttribute(
      "href",
      "/details",
    );
    expect(screen.getByRole("link", { name: "Details" })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
    expect(screen.getByRole("link", { name: "Details" })).toHaveAttribute(
      "target",
      "_blank",
    );
  });

  it("renders timeline items in order, retains optional labels, and omits incomplete items", () => {
    const props = {
      _key: "timeline",
      _type: "stackedTimeline",
      title: "Our process",
      intro: "Two useful steps.",
      buttons: [
        {
          _key: "contact",
          text: "Contact us",
          href: "/contact",
          variant: "outline",
        },
      ],
      items: [
        {
          _key: "first",
          title: "Discovery",
          meta: "Week 1",
          text: "Learn what matters.",
        },
        { _key: "draft", title: "Incomplete" },
        { _key: "last", title: "Delivery", text: "Share the result." },
      ],
    } as unknown as ComponentProps<typeof StackedTimeline>;
    render(<StackedTimeline {...props} />);
    const list = screen.getByRole("list", { name: "Timeline" });
    expect(list.tagName).toBe("OL");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Discovery");
    expect(items[0]).toHaveTextContent("Week 1");
    expect(items[1]).toHaveTextContent("Delivery");
    expect(screen.queryByText("Incomplete")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Contact us" })).toHaveAttribute(
      "href",
      "/contact",
    );
  });
});
