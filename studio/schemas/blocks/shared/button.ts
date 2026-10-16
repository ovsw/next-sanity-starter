import { defineField, defineType } from "sanity";

export default defineType({
  name: "button",
  title: "Button",
  type: "object",
  fields: [
    defineField({ name: "text", title: "Button Text", type: "string" }),
    defineField({ name: "url", title: "URL", type: "customUrl" }),
  ],
  preview: {
    select: { title: "text", subtitle: "url.external" },
  },
});
