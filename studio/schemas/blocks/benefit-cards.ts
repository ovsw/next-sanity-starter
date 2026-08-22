import { LayoutGrid } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import NavigationIconInput, {
  createNavigationIconPreview,
} from "../inputs/navigation-icon-input";
import { isNavigationIconName } from "../inputs/lucide-icon-catalog";

const benefitCard = defineArrayMember({
  name: "featureGridItem",
  title: "Feature",
  type: "object",
  fields: [
    defineField({
      name: "icon",
      title: "Icon",
      type: "object",
      description: "Choose an icon that helps identify this feature.",
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
        rule.custom((value) => {
          const icon = value as { name?: string; svg?: string } | undefined;
          if (!icon?.name) return true;
          if (!isNavigationIconName(icon.name)) {
            return "Choose an icon from the icon picker";
          }
          if (!icon.svg) {
            return "Re-pick this icon so its artwork is stored with the document";
          }
          return true;
        }),
    }),
    defineField({
      name: "title",
      type: "string",
      description: "The heading shown for this feature.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "simpleRichText",
      description:
        "A short explanation. Paragraphs support bold, italic, and links.",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { icon: "icon.name", title: "title" },
    prepare: ({ icon, title }) => ({
      title: title || "Untitled Card",
      subtitle: "Feature",
      media: icon ? createNavigationIconPreview(icon) : undefined,
    }),
  },
});

export default defineType({
  name: "benefitCards",
  title: "Feature Grid",
  type: "object",
  icon: LayoutGrid,
  description:
    "A reusable grid for features, services, reasons, or benefits.",
  initialValue: {
    eyebrow: "Highlights",
    title: "Useful features for common marketing pages.",
    intro:
      "Replace this sample with a short explanation of what these items help visitors understand.",
    cards: [
      {
        _key: "starter-feature-one",
        _type: "featureGridItem",
        title: "Clear content structure",
        body: [
          {
            _key: "starter-feature-one-body",
            _type: "block",
            children: [
              {
                _key: "starter-feature-one-span",
                _type: "span",
                marks: [],
                text: "Explain one reusable strength, service, or outcome.",
              },
            ],
            markDefs: [],
            style: "normal",
          },
        ],
      },
    ],
  },
  fields: [
    defineField({
      name: "useCreamBackground",
      title: "Use Alternate Background",
      type: "boolean",
      description:
        "Turn on to separate this section from the surrounding page content.",
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
      description: "The main heading for the feature grid.",
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
      title: "Features",
      type: "array",
      description:
        "Add up to 6 feature items. They are shown in the order listed here.",
      of: [benefitCard],
      validation: (rule) => rule.required().min(1).max(6),
    }),
  ],
  preview: {
    select: { title: "title", cards: "cards" },
    prepare: ({ title, cards }) => {
      const count = Array.isArray(cards) ? cards.length : 0;
      return {
        title: title || "Untitled Feature Grid",
        subtitle: `Feature Grid - ${count} ${count === 1 ? "feature" : "features"}`,
      };
    },
  },
});
