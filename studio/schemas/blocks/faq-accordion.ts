import { MessageCircle } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "faqAccordion",
  title: "FAQ Section",
  type: "object",
  icon: MessageCircle,
  description: "A reusable FAQ section built from selected FAQ documents.",
  initialValue: {
    eyebrow: "FAQ",
    title: "Common questions",
    subtitle: "Replace this sample with the questions visitors ask most often.",
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
      title: "Eyebrow",
      description:
        "The smaller text that sits above the title to provide context",
    }),
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      description: "The large text that is the primary focus of the block",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "subtitle",
      type: "string",
      title: "Subtitle",
      description: "Additional context below the main title",
    }),
    defineField({
      name: "link",
      title: "Link",
      type: "object",
      description: "Optional link for additional content or actions",
      fields: [
        defineField({
          name: "title",
          type: "string",
          title: "Link Title",
          description: "The text to display for the link",
        }),
        defineField({
          name: "description",
          type: "string",
          title: "Link Description",
          description: "A brief description of where the link leads",
        }),
        defineField({
          name: "url",
          type: "customUrl",
          title: "URL",
          description: "The destination URL for the link",
        }),
      ],
    }),
    defineField({
      name: "faqs",
      type: "array",
      title: "FAQs",
      description: "Select the FAQ items to display in this accordion",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "faq" }],
          options: { disableNew: true },
        }),
      ],
      validation: (rule) => [rule.required(), rule.unique()],
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Untitled FAQ Section",
      subtitle: "FAQ Section",
    }),
  },
});
