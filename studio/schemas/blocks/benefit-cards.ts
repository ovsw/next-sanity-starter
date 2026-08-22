import { LayoutGrid } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import NavigationIconInput, {
  createNavigationIconPreview,
} from "../inputs/navigation-icon-input";
import { isNavigationIconName } from "../inputs/lucide-icon-catalog";
import { isLoanIconName } from "../../../shared/loan-icons";
import { sectionNavField } from "./shared/section-nav.ts";

const benefitCard = defineArrayMember({
  name: "phxBenefitCard",
  title: "Card",
  type: "object",
  fields: [
    defineField({
      name: "icon",
      title: "Icon",
      type: "object",
      description: "Choose a custom loan icon or any canonical Lucide icon.",
      components: {
        input: NavigationIconInput,
      },
      fields: [
        defineField({ name: "name", title: "Name", type: "string" }),
        // The icon's SVG markup, captured at pick time so the frontend can
        // render it without bundling the full Lucide icon set.
        defineField({ name: "svg", title: "SVG markup", type: "string", hidden: true }),
      ],
      validation: (rule) =>
        rule.required().custom((value) => {
          const icon = value as { name?: string; svg?: string } | undefined;
          if (!icon?.name) return "Choose an icon from the icon picker";
          if (!isNavigationIconName(icon.name)) {
            return "Choose an icon from the icon picker";
          }
          if (!isLoanIconName(icon.name) && !icon.svg) {
            return "Re-pick this icon so its artwork is stored with the document";
          }
          return true;
        }),
    }),
    defineField({
      name: "title",
      type: "string",
      description: "The card heading, such as \"Lower your interest rate\"",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "simpleRichText",
      description:
        "The explanation for this benefit. Paragraphs with bold and italic only.",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { icon: "icon.name", title: "title" },
    prepare: ({ icon, title }) => ({
      title: title || "Untitled Card",
      subtitle: "Card",
      media: icon ? createNavigationIconPreview(icon) : undefined,
    }),
  },
});

export default defineType({
  name: "benefitCards",
  title: "Benefit Cards",
  type: "object",
  icon: LayoutGrid,
  description:
    "A grid of numbered cards with icons, for listing reasons or benefits",
  fields: [
    defineField({
      name: "useCreamBackground",
      title: "Use Cream Background",
      type: "boolean",
      description:
        "Turn on to use a cream background for this section. Leave off for white.",
      initialValue: false,
    }),
    defineField({
      name: "eyebrow",
      type: "string",
      description: "Optional text shown above the section title",
    }),
    defineField({
      name: "title",
      type: "string",
      description: "The main heading for the benefits section",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "intro",
      type: "text",
      rows: 4,
      description: "Optional paragraph shown under the section heading",
    }),
    defineField({
      name: "cards",
      type: "array",
      description:
        "Add up to 6 benefit cards. They are numbered automatically in the order listed here.",
      of: [benefitCard],
      validation: (rule) => rule.required().min(1).max(6),
    }),
    sectionNavField(),
  ],
  preview: {
    select: { title: "title", cards: "cards" },
    prepare: ({ title, cards }) => {
      const count = Array.isArray(cards) ? cards.length : 0;
      return {
        title: title || "Untitled Benefit Cards",
        subtitle: `Benefit Cards — ${count} ${count === 1 ? "card" : "cards"}`,
      };
    },
  },
});
