import { ListOrdered } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

const item = defineArrayMember({
  name: "stackedTimelineItem",
  title: "Card",
  type: "object",
  fields: [
    defineField({
      name: "title",
      type: "string",
      description:
        "The name of this step, stop, or milestone, such as Discovery.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "meta",
      title: "Small label",
      type: "string",
      description:
        "Optional. Shown as written beside the number, e.g. 10:00 am or 1975.",
    }),
    defineField({
      name: "text",
      title: "One line",
      type: "string",
      description:
        "One sentence on what happens here. Use clear, familiar words.",
      validation: (rule) => rule.required().max(180),
    }),
    defineField({
      name: "image",
      title: "Photo",
      type: "image",
      description:
        "Optional. Shown 16:9 above the text. Leave empty until a real photo exists.",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alt Text",
          type: "string",
          description: "What the photo shows, for screen readers.",
          validation: (rule) =>
            rule.custom((value, context) => {
              const parent = context.parent as { asset?: unknown } | undefined;
              return parent?.asset && !value?.trim()
                ? "Alt text is required when an image is set"
                : true;
            }),
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "title", meta: "meta", media: "image" },
    prepare: ({ title, meta, media }) => ({
      title: title || "Untitled Card",
      subtitle: meta || undefined,
      media,
    }),
  },
});

export default defineType({
  name: "stackedTimeline",
  title: "Timeline",
  type: "object",
  icon: ListOrdered,
  description:
    "An introduction with up to two actions beside numbered cards, in order. Everything stacks on phones.",
  fields: [
    defineField({
      name: "useAlternateBackground",
      title: "Use Alternate Background",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "eyebrow",
      type: "string",
      description: "Optional short label shown above the heading.",
    }),
    defineField({
      name: "title",
      title: "Heading",
      type: "string",
      description: "The main heading for the section.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "intro",
      title: "Intro line",
      type: "text",
      rows: 2,
      description: "Optional. One or two sentences under the heading.",
    }),
    defineField({
      name: "buttons",
      type: "array",
      description:
        "Optional. Up to two actions under the intro. Each action uses its selected button style.",
      of: [defineArrayMember({ type: "button" })],
      validation: (rule) => rule.max(2),
    }),
    defineField({
      name: "items",
      title: "Cards",
      type: "array",
      description: "Cards are shown in the order listed here, first to last.",
      of: [item],
      validation: (rule) => rule.required().min(2).max(8),
    }),
  ],
  preview: {
    select: { title: "title", items: "items" },
    prepare: ({ title, items }) => {
      const count = Array.isArray(items) ? items.length : 0;
      return {
        title: title || "Timeline",
        subtitle: `${count} ${count === 1 ? "card" : "cards"}`,
      };
    },
  },
});
