import { UserRoundCheck } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import { sectionNavField } from "./shared/section-nav.ts";

export default defineType({
  name: "advisorCta",
  title: "Advisor CTA",
  type: "object",
  icon: UserRoundCheck,
  description: "Call-to-action featuring a portrait and advisor messaging",
  fields: [
    defineField({
      name: "useCreamBackground",
      title: "Use Cream Background",
      type: "boolean",
      description: "Turn on to use a cream background. Leave off for white.",
      initialValue: false,
    }),
    defineField({
      name: "eyebrow",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "richText",
      title: "Description",
      type: "array",
      of: [
        defineArrayMember({
          type: "block",
          marks: {
            decorators: [
              { title: "Strong", value: "strong" },
              { title: "Emphasis", value: "em" },
            ],
          },
        }),
      ],
    }),
    defineField({
      name: "buttons",
      type: "array",
      of: [defineArrayMember({ type: "button" })],
      validation: (rule) => rule.min(1).max(2),
    }),
    defineField({
      name: "portraitImage",
      title: "Portrait Image",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alternative Text",
          type: "string",
          validation: (rule) =>
            rule.custom((value, context) => {
              const image = context.parent as { asset?: unknown } | undefined;
              return image?.asset && !value?.trim()
                ? "Alternative text is required when a portrait is set"
                : true;
            }),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    sectionNavField(),
  ],
  preview: {
    select: { media: "portraitImage", title: "title" },
    prepare: ({ media, title }) => ({
      media,
      subtitle: "Advisor CTA",
      title: title || "Untitled Advisor CTA",
    }),
  },
});
