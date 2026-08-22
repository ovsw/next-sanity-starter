import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import CtaBanner from "./cta-banner";
import BenefitCards from "./benefit-cards";
import FaqAccordion from "./faq-accordion";
import Hero from "./hero";
import RichTextBlock from "./rich-text-block";
import StoryFeature from "./story-feature";
import TeamMembers from "./team-members";

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

  it("renders reusable marketing sections with semantic content", () => {
    const featureGrid = {
      _key: "features",
      _type: "benefitCards",
      cards: [
        {
          _key: "feature-one",
          _type: "featureGridItem",
          body: [paragraph("feature-body", "Short, useful context.")],
          icon: null,
          title: "Reusable content blocks",
        },
      ],
      intro: "Common sections for marketing pages.",
      title: "Feature grid",
    } as unknown as ComponentProps<typeof BenefitCards>;
    const { rerender } = render(<BenefitCards {...featureGrid} />);

    expect(
      screen.getByRole("heading", { name: "Feature grid" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Reusable content blocks" }),
    ).toBeInTheDocument();

    const imageAndText = {
      _key: "image-text",
      _type: "storyFeature",
      buttons: [],
      image: null,
      keyDetails: {
        items: ["Reusable", "Neutral"],
        title: "Details",
      },
      richText: [paragraph("story-copy", "Story context visitors can use.")],
      title: "Image and text",
    } as unknown as ComponentProps<typeof StoryFeature>;
    rerender(<StoryFeature {...imageAndText} />);

    expect(
      screen.getByRole("heading", { name: "Image and text" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Reusable")).toBeInTheDocument();

    const faqSection = {
      _key: "faq",
      _type: "faqAccordion",
      faqs: [
        {
          _id: "faq-one",
          _key: "faq-one",
          _type: "faq",
          answer: [paragraph("faq-answer", "Use Sanity to manage it.")],
          title: "How is this content reused?",
        },
      ],
      title: "Questions",
    } as unknown as ComponentProps<typeof FaqAccordion>;
    rerender(<FaqAccordion {...faqSection} />);

    expect(
      screen.getByRole("button", { name: /How is this content reused/i }),
    ).toBeInTheDocument();

    const team = {
      _key: "team",
      _type: "teamMembers",
      members: [
        {
          _key: "person-one",
          _ref: "person-one",
          _type: "reference",
          document: {
            _id: "person-one",
            _type: "teamMember",
            bio: [paragraph("person-bio", "Leads client strategy.")],
            email: "hello@example.com",
            image: null,
            name: "Avery Stone",
            phone: null,
            role: "Founder",
            sortOrder: 1,
          },
        },
      ],
      title: "Team",
    } as unknown as ComponentProps<typeof TeamMembers>;
    rerender(<TeamMembers {...team} />);

    expect(screen.getByRole("heading", { name: "Team" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Avery Stone" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Email Avery" })).toHaveAttribute(
      "href",
      "mailto:hello@example.com",
    );
  });
});
