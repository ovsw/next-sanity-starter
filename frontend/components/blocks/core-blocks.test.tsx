import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import CtaBanner from "./cta-banner";
import Hero from "./hero";
import RichTextBlock from "./rich-text-block";

const paragraph = (key: string, text: string) => ({
  _key: key,
  _type: "block",
  children: [
    { _key: `${key}-span`, _type: "span", marks: [], text },
  ],
  markDefs: [],
  style: "normal",
});

describe("core Page Builder sections", () => {
  it("renders the neutral hero with its safe action", () => {
    const hero = {
      _key: "hero",
      _type: "hero",
      body: [paragraph("hero-body", "A useful supporting message.")],
      buttons: [
        {
          _key: "work",
          _type: "button",
          href: "/work",
          openInNewTab: false,
          text: "See our work",
          variant: "default",
        },
      ],
      eyebrow: "Independent practice",
      image: null,
      title: "Clear thinking for complicated work.",
    } as unknown as ComponentProps<typeof Hero>;
    render(
      <Hero {...hero} />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Clear thinking for complicated work.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See our work" })).toHaveAttribute(
      "href",
      "/work",
    );
  });

  it("renders rich text and a closing call to action", () => {
    const richText = {
      _key: "story",
      _type: "richTextBlock",
      eyebrow: "What we do",
      richText: [paragraph("story-body", "Details visitors can use.")],
      title: "Built to make the next decision easier.",
    } as unknown as ComponentProps<typeof RichTextBlock>;
    const { rerender } = render(
      <RichTextBlock {...richText} />,
    );
    expect(
      screen.getByRole("heading", {
        name: "Built to make the next decision easier.",
      }),
    ).toBeInTheDocument();

    const cta = {
      _key: "cta",
      _type: "ctaBanner",
      buttons: [
        {
          _key: "contact",
          _type: "button",
          href: "/contact",
          openInNewTab: false,
          text: "Start a conversation",
          variant: "default",
        },
      ],
      description: "Tell us what you are working through.",
      title: "Have a complicated idea?",
    } as unknown as ComponentProps<typeof CtaBanner>;
    rerender(<CtaBanner {...cta} />);
    expect(
      screen.getByRole("link", { name: "Start a conversation" }),
    ).toHaveAttribute("href", "/contact");
  });
});
