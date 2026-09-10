import { MessageCircle } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "faqAccordion",
  title: "FAQ Section",
  type: "object",
  icon: MessageCircle,
  description: "A reusable FAQ section built from selected FAQ documents.",
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      description: "The large text that is the primary focus of the block",
      validation: (rule) => rule.required(),
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
