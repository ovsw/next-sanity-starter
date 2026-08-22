import { Newspaper } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "latestArticles",
  title: "Latest Posts",
  type: "object",
  icon: Newspaper,
  description: "Displays the latest published Blog Posts.",
  fields: [
    defineField({
      name: "eyebrow",
      type: "string",
      description: "Optional short label shown before the section title.",
    }),
    defineField({
      name: "title",
      type: "string",
      description: "The main heading for the latest posts section.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 3,
      description: "Optional supporting copy.",
    }),
    defineField({
      name: "buttons",
      type: "array",
      description: "Optional links shown with the section heading.",
      of: [defineArrayMember({ type: "button" })],
    }),
    defineField({
      name: "fallbackImage",
      title: "Fallback Image",
      type: "image",
      description: "Optional image shown when a post has no image.",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alternative Text",
          type: "string",
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "title", media: "fallbackImage" },
    prepare: ({ title, media }) => ({
      title: title || "Latest Posts",
      subtitle: "Latest Posts",
      media,
    }),
  },
});
