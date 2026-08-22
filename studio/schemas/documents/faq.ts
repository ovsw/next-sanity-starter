import { defineField, defineType } from "sanity";
import { ListCollapse } from "lucide-react";

export default defineType({
  name: "faq",
  title: "FAQ",
  type: "document",
  icon: ListCollapse,
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "body",
      type: "simpleRichText",
    }),
  ],

  preview: {
    select: {
      title: "title",
    },
  },
});
