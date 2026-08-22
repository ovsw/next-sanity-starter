import { TextIcon } from "lucide-react";
import { defineField, defineType } from "sanity";
import { sectionNavField } from "./shared/section-nav.ts";

export default defineType({
  name: "richTextBlock",
  title: "Rich Text Block",
  type: "object",
  icon: TextIcon,
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
    sectionNavField(),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Rich Text",
      subtitle: "Rich Text Block",
    }),
  },
});
