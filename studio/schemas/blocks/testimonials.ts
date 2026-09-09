import { MessageSquareQuote } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "testimonials",
  title: "Testimonials",
  type: "object",
  icon: MessageSquareQuote,
  description:
    "Quotes from selected Testimonial documents. Three cards on desktop, one card wide with swipe on phones.",
  fields: [
    defineField({
      name: "useAlternateBackground",
      title: "Use Alternate Background",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      type: "string",
      description: "Short label shown above the heading.",
    }),
    defineField({
      name: "title",
      title: "Heading",
      type: "string",
      description: "The main heading for the section.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "testimonials",
      title: "Testimonials",
      type: "array",
      description: "The quotes to show, in the order listed here.",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "testimonial" }],
        }),
      ],
      validation: (rule) => [
        rule
          .required()
          .min(1)
          .error("Add at least one testimonial to this section."),
        rule.unique().error("Each testimonial can only be added once."),
      ],
    }),
  ],
  preview: {
    select: {
      eyebrow: "eyebrow",
      title: "title",
      testimonials: "testimonials",
    },
    prepare: ({ eyebrow, title, testimonials }) => {
      const count = Array.isArray(testimonials) ? testimonials.length : 0;
      return {
        title: title || eyebrow || "Testimonials",
        subtitle: `Testimonials · ${count} ${count === 1 ? "quote" : "quotes"}`,
      };
    },
  },
});
