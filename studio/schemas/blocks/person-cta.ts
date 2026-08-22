import { ContactRound } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import { sectionNavField } from "./shared/section-nav.ts";

export default defineType({
  name: "personCta",
  title: "Person CTA",
  type: "object",
  icon: ContactRound,
  description: "A contact call-to-action featuring an editable person portrait",
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
      description: "The short uppercase label shown above the main heading",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "title",
      type: "string",
      description: "The main heading for this contact call-to-action",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "richText",
      title: "Description",
      type: "array",
      description: "The supporting message shown below the heading",
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
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "keyDetails",
      title: "Key Details",
      type: "object",
      description: "Optional short facts shown as non-interactive pills",
      fields: [
        defineField({
          name: "title",
          type: "string",
          description: "Optional label shown above the key details",
        }),
        defineField({
          name: "items",
          type: "array",
          description: "Short facts to display as pills",
          of: [defineArrayMember({ type: "string" })],
          validation: (rule) => rule.required().min(1).max(8),
        }),
      ],
    }),
    defineField({
      name: "buttons",
      title: "Buttons",
      type: "array",
      description: "One or two contact pathways shown below the message",
      of: [defineArrayMember({ type: "button" })],
      validation: (rule) => rule.required().min(1).max(2),
    }),
    defineField({
      name: "personImage",
      title: "Person Image",
      type: "image",
      description:
        "The editable person portrait. Use a transparent image so the fixed background shape remains visible.",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alternative Text",
          type: "string",
          description: "Describe the person for visitors using screen readers",
          validation: (rule) =>
            rule.custom((value, context) => {
              const image = context.parent as { asset?: unknown } | undefined;
              return image?.asset && !value?.trim()
                ? "Alternative text is required when a person image is set"
                : true;
            }),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    sectionNavField(),
  ],
  preview: {
    select: { media: "personImage", title: "title" },
    prepare: ({ media, title }) => ({
      media,
      subtitle: "Person CTA",
      title: title || "Untitled Person CTA",
    }),
  },
});
