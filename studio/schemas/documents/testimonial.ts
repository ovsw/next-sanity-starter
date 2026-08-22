import { Quote } from "lucide-react";
import { defineField, defineType } from "sanity";

export default defineType({
  name: "testimonial",
  title: "Testimonial",
  type: "document",
  icon: Quote,
  description:
    "A reusable customer or stakeholder quote that can be referenced by project-specific sections.",
  initialValue: {
    rating: 5,
  },
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      description: "The person or organization giving the testimonial.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "Optional role, company, or context shown with the quote.",
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Alt Text",
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
    defineField({
      name: "body",
      title: "Quote",
      type: "simpleRichText",
      description: "The testimonial text.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "rating",
      title: "Rating",
      type: "number",
      description: "Optional numeric rating from 1 to 5.",
      validation: (rule) => rule.min(1).max(5),
    }),
  ],

  preview: {
    select: {
      title: "name",
      subtitle: "title",
      media: "image",
    },
    prepare: ({ media, subtitle, title }) => ({
      title: title || "Untitled Testimonial",
      subtitle: subtitle || "Reusable testimonial",
      media,
    }),
  },
});
