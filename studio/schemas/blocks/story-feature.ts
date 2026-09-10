import { BookOpenText } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
// Content contract for Shadcnblocks feature1.
export default defineType({
  name: "storyFeature",
  title: "Image and Text · Feature 1",
  type: "object",
  icon: BookOpenText,
  fields: [
    defineField({
      name: "title",
      title: "Heading",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "image",
      type: "image",
      options: { hotspot: true },
      fields: [defineField({ name: "alt", title: "Alt text", type: "string" })],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "buttons",
      title: "Action",
      type: "array",
      of: [defineArrayMember({ type: "button" })],
      validation: (rule) => rule.max(1),
    }),
  ],
  preview: { select: { title: "title", media: "image" } },
});
