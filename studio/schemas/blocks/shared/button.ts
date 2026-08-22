import { defineField, defineType } from "sanity";

export default defineType({
  name: "button",
  title: "Button",
  type: "object",
  fields: [
    defineField({
      name: "variant",
      type: "string",
      hidden: ({ document }) =>
        document?._type === "blogPostSettings" || document?._type === "settings",
      initialValue: "default",
      options: {
        layout: "radio",
        list: [
          { title: "Default", value: "default" },
          { title: "Secondary", value: "secondary" },
          { title: "Outline", value: "outline" },
          { title: "Link", value: "link" },
        ],
      },
    }),
    defineField({ name: "text", title: "Button Text", type: "string" }),
    defineField({ name: "url", title: "URL", type: "customUrl" }),
  ],
  preview: {
    select: { title: "text", subtitle: "url.external" },
  },
});
