import { Newspaper } from "lucide-react";
import { defineField, defineType } from "sanity";
import { blocksField } from "../blocks/page-builder";
import meta from "../blocks/shared/meta";

export default defineType({
  name: "blogIndex",
  title: "Blog Index",
  type: "document",
  icon: Newspaper,
  groups: [
    { name: "content", title: "Content" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "title",
      type: "string",
      group: "content",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 3,
      group: "content",
      validation: (rule) =>
        rule
          .custom((value) =>
            value?.trim() ? true : "Add a description for the Blog Index header",
          )
          .warning(),
    }),
    blocksField,
    meta,
  ],
  preview: {
    select: { title: "title", subtitle: "description" },
    prepare: ({ subtitle, title }) => ({
      title: title || "Untitled Blog Index",
      subtitle: subtitle || "/blog/",
    }),
  },
});
