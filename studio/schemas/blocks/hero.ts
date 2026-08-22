import { LayoutTemplate } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "hero",
  title: "Hero",
  type: "object",
  icon: LayoutTemplate,
  description:
    "An editorial introduction with a heading, supporting copy, actions, and optional image.",
  initialValue: {
    eyebrow: "Independent practice",
    title: "Clear thinking for complicated work.",
    body: [
      {
        _key: "starter-hero-body",
        _type: "block",
        children: [
          {
            _key: "starter-hero-body-text",
            _type: "span",
            marks: [],
            text: "Use this space to explain what your organization does and why it matters.",
          },
        ],
        markDefs: [],
        style: "normal",
      },
    ],
    buttons: [
      {
        _key: "starter-hero-action",
        _type: "button",
        text: "Explore our work",
        url: {
          _type: "customUrl",
          type: "internal",
          internal: { _type: "reference", _ref: "homePage" },
          openInNewTab: false,
        },
        variant: "default",
      },
    ],
  },
  fields: [
    defineField({
      name: "eyebrow",
      type: "string",
      description: "Optional short context shown above the heading.",
    }),
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Supporting message",
      type: "simpleRichText",
    }),
    defineField({
      name: "buttons",
      type: "array",
      of: [defineArrayMember({ type: "button" })],
      validation: (rule) => rule.max(2),
    }),
    defineField({
      name: "image",
      type: "image",
      options: { hotspot: true },
      description: "Optional image shown with the introduction.",
      fields: [
        defineField({
          name: "alt",
          title: "Alternative text",
          type: "string",
          validation: (rule) =>
            rule.custom((value, context) => {
              const image = context.parent as { asset?: unknown } | undefined;
              return image?.asset && !value
                ? "Describe the image for visitors who cannot see it"
                : true;
            }),
        }),
      ],
    }),
  ],
  preview: {
    select: { media: "image", title: "title" },
    prepare: ({ media, title }) => ({
      title: title || "Untitled Hero",
      subtitle: "Hero",
      media,
    }),
  },
});
