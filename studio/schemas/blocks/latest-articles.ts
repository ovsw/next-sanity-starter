import { Newspaper } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "latestArticles",
  title: "Latest Articles",
  type: "object",
  icon: Newspaper,
  description: "Displays the latest published Educational Content articles",
  fields: [
    defineField({
      name: "useCreamBackground",
      title: "Use Cream Background",
      type: "boolean",
      description: "Turn on to use a cream background for this section. Leave off for white.",
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
      description: "The main heading for the latest Educational Content section",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      description: "Optional supporting copy that explains what visitors can browse",
    }),
    defineField({
      name: "buttons",
      type: "array",
      description: "Optional links shown beside the section heading",
      of: [defineArrayMember({ type: "button" })],
    }),
    defineField({
      name: "fallbackImage",
      title: "Fallback Image",
      type: "image",
      description: "Optional image shown when an article has no image",
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
      title: title || "Latest Articles",
      subtitle: "Latest Articles",
      media,
    }),
  },
});
