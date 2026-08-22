import { TextIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

export default defineType({
  name: "richTextBlock",
  title: "Rich Text Block",
  type: "object",
  icon: TextIcon,
  description: "Long-form editorial content with an optional introduction.",
  initialValue: {
    eyebrow: "What we do",
    title: "Built to make the next decision easier.",
    richText: [
      {
        _key: "starter-rich-text",
        _type: "block",
        children: [
          {
            _key: "starter-rich-text-span",
            _type: "span",
            marks: [],
            text: "Replace this sample with the useful details visitors need to understand your work and take the next step.",
          },
        ],
        markDefs: [],
        style: "normal",
      },
    ],
  },
  fields: [
    defineField({
      name: "eyebrow",
      type: "string",
      description: "Optional short label shown above the section heading",
    }),
    defineField({
      name: "title",
      type: "string",
      description: "Optional heading shown above the rich text content",
    }),
    defineField({
      name: "richText",
      title: "Content",
      type: "richTextContent",
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Untitled Rich Text",
      subtitle: "Rich Text",
    }),
  },
});
