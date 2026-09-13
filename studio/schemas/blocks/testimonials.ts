import { MessageSquareQuote } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import sectionTheme from "./shared/section-theme";

export default defineType({
  name: "testimonials",
  title: "Testimonials",
  type: "object",
  icon: MessageSquareQuote,
  description:
    "Centered quotes and attribution from selected Testimonial documents.",
  fields: [
    sectionTheme,
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
      title: "title",
      testimonials: "testimonials",
    },
    prepare: ({ title, testimonials }) => {
      const count = Array.isArray(testimonials) ? testimonials.length : 0;
      return {
        title: title || "Testimonials",
        subtitle: `Testimonials · ${count} ${count === 1 ? "quote" : "quotes"}`,
      };
    },
  },
});
