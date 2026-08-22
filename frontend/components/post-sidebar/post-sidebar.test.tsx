import type { PortableTextProps } from "@portabletext/react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RichTextContent from "@/components/rich-text-content";
import {
  createPostBodyModel,
  type BlogPostSidebar,
} from "./model";
import { PostSidebar, PostTableOfContentsRail } from "./post-sidebar";

function heading(key: string, style: string, text: string) {
  return {
    _key: key,
    _type: "block",
    children: [{ _key: `${key}-span`, _type: "span", marks: [], text }],
    markDefs: [],
    style,
  };
}

const threeHeadings = [
  heading("first", "h2", "First section"),
  heading("child", "h3", "Child section"),
  heading("second", "h2", "Second section"),
] as PortableTextProps["value"];

const currentSidebar = {
  _id: "blogPostSettings",
  _type: "blogPostSettings",
  title: "Contact Jimmy",
  description: "Choose the next step that fits where you are in the mortgage process.",
  actions: [
    {
      _key: "call",
      title: "Call Jimmy",
      description: "Speak with Jimmy's team about your home loan options.",
      text: "Call 480-800-8387",
      openInNewTab: false,
      href: "tel:+14808008387",
    },
    {
      _key: "apply",
      title: "Apply online for a loan today!",
      description: "Fast and easy online application.",
      text: "Apply Online",
      openInNewTab: true,
      href: "https://applynow.example.com/",
    },
    {
      _key: "mortgage-calculator",
      title: "Mortgage Calculator",
      description: "Find out what you can expect to pay for your home loan.",
      text: "Calculate Now",
      openInNewTab: false,
      href: "/mortgage-calculator/",
    },
    {
      _key: "home-value",
      title: "What's My Home Worth?",
      description: "Get a ballpark estimate for your home with our online calculator.",
      text: "Calculate Now",
      openInNewTab: false,
      href: "/home-value-estimator/",
    },
  ],
} satisfies BlogPostSidebar;

describe("PostSidebar", () => {
  it("renders all four CMS actions in document order", () => {
    render(<PostSidebar sidebar={currentSidebar} />);

    const sidebar = screen.getByRole("complementary", {
      name: "Post contact options",
    });
    expect(within(sidebar).getByRole("heading", { name: "Contact Jimmy" })).toBeInTheDocument();
    expect(
      within(sidebar).getAllByRole("heading", { level: 3 }).map((item) => item.textContent),
    ).toEqual([
      "Call Jimmy",
      "Apply online for a loan today!",
      "Mortgage Calculator",
      "What's My Home Worth?",
    ]);
  });

  it("points click-to-edit at Blog Post Settings fields", () => {
    const dataAttribute = vi.fn((path: string) => `source:${path}`);
    render(<PostSidebar dataAttribute={dataAttribute} sidebar={currentSidebar} />);

    expect(screen.getByRole("complementary", { name: "Post contact options" })).toHaveAttribute(
      "data-sanity",
      "source:actions",
    );
    expect(screen.getByRole("heading", { name: "Contact Jimmy" })).toHaveAttribute(
      "data-sanity",
      "source:title",
    );
    expect(dataAttribute).not.toHaveBeenCalledWith(expect.stringContaining("blogPostSidebar."));
  });

  it("renders exactly two CMS actions in document order", () => {
    render(
      <PostSidebar
        sidebar={{ ...currentSidebar, actions: currentSidebar.actions.slice(0, 2) }}
      />,
    );

    expect(screen.getAllByRole("heading", { level: 3 }).map((item) => item.textContent)).toEqual([
      "Call Jimmy",
      "Apply online for a loan today!",
    ]);
  });

  it("uses action order to choose the solid button", () => {
    render(<PostSidebar sidebar={currentSidebar} />);

    expect(screen.getByRole("link", { name: "Call 480-800-8387" })).toHaveClass(
      "bg-primary",
    );
    expect(screen.getByRole("link", { name: "Apply Online" })).not.toHaveClass(
      "bg-primary",
    );
  });

  it("places secondary descriptions before their links", () => {
    render(<PostSidebar sidebar={currentSidebar} />);

    const description = screen.getByText("Fast and easy online application.");
    const link = screen.getByRole("link", { name: "Apply Online" });
    expect(description.nextElementSibling).toBe(link);
  });

  it.each([
    ["missing", null],
    ["empty", { ...currentSidebar, actions: [] }],
  ])("renders nothing for a %s sidebar", (_label, sidebar) => {
    const { container } = render(
      <PostSidebar sidebar={sidebar as BlogPostSidebar | null} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("uses the correct link element and target behavior for internal, external, and tel destinations", () => {
    render(<PostSidebar sidebar={currentSidebar} />);

    const phone = screen.getByRole("link", { name: "Call 480-800-8387" });
    expect(phone).toHaveAttribute("href", "tel:+14808008387");
    expect(phone).not.toHaveAttribute("target");

    const apply = screen.getByRole("link", { name: "Apply Online" });
    expect(apply).toHaveAttribute("href", "https://applynow.example.com/");
    expect(apply).toHaveAttribute("target", "_blank");
    expect(apply).toHaveAttribute("rel", "noopener noreferrer");

    const internalCard = screen
      .getByRole("heading", { name: "Mortgage Calculator" })
      .closest("section");
    const internal = within(internalCard as HTMLElement).getByRole("link", {
      name: "Calculate Now",
    });
    expect(internal).toHaveAttribute("href", "/mortgage-calculator");
    expect(internal).not.toHaveAttribute("target");
  });

  it("shows a native open table of contents for three headings", () => {
    const bodyModel = createPostBodyModel(threeHeadings);
    render(<PostTableOfContentsRail headings={bodyModel.headings} />);

    expect(screen.getByText("Table of Contents").closest("details")).toHaveAttribute("open");
    expect(screen.getByRole("navigation", { name: "Table of Contents" })).toBeInTheDocument();
  });

  it("renders hierarchical anchors that match the scoped post heading IDs", () => {
    const bodyModel = createPostBodyModel(threeHeadings);
    render(
      <>
        <RichTextContent getHeadingId={bodyModel.getHeadingId} value={threeHeadings} />
        <PostTableOfContentsRail headings={bodyModel.headings} />
      </>,
    );

    const firstLink = screen.getByRole("link", { name: "First section" });
    const childLink = screen.getByRole("link", { name: "Child section" });
    expect(firstLink).toHaveAttribute("href", "#first-section");
    expect(childLink).toHaveAttribute("href", "#child-section");
    expect(document.querySelector("h2#first-section")).toBeInTheDocument();
    expect(document.querySelector("h3#child-section")).toBeInTheDocument();
    expect(firstLink.closest("li")).toContainElement(childLink);
  });

  it("matches an ID for a valid heading even when its Portable Text key is absent", () => {
    const unkeyedHeading = heading("temporary", "h2", "Unkeyed heading");
    delete (unkeyedHeading as { _key?: string })._key;
    const body = [
      unkeyedHeading,
      heading("second", "h2", "Second heading"),
      heading("third", "h2", "Third heading"),
    ];
    const bodyModel = createPostBodyModel(body as PortableTextProps["value"]);

    render(
      <>
        <RichTextContent getHeadingId={bodyModel.getHeadingId} value={body} />
        <PostTableOfContentsRail headings={bodyModel.headings} />
      </>,
    );

    expect(screen.getByRole("link", { name: "Unkeyed heading" })).toHaveAttribute(
      "href",
      "#unkeyed-heading",
    );
    expect(document.querySelector("h2#unkeyed-heading")).toBeInTheDocument();
  });
});
