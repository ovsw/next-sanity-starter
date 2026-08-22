import { PanelTop } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "pageHeader",
  title: "Page Header",
  type: "object",
  icon: PanelTop,
  description:
    "Page opener with a breadcrumb label, large heading, and intro copy",
  fields: [
    defineField({
      name: "eyebrow",
      type: "string",
      description:
        "Short breadcrumb label shown after Home, such as Blog or Refinancing",
    }),
    defineField({
      name: "title",
      type: "string",
      description: "The main page heading visitors will see",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      description: "Short intro copy shown below the heading",
    }),
    defineField({
      name: "statistics",
      title: "Statistics",
      type: "array",
      description:
        "Optional trust signals shown beneath the introduction, such as a year or service area",
      of: [
        defineArrayMember({
          name: "statistic",
          title: "Statistic",
          type: "object",
          fields: [
            defineField({
              name: "value",
              type: "string",
              description: "The prominent value, such as 2005 or All 50 states",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "description",
              type: "string",
              description: "Short context explaining what the value represents",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {
              title: "value",
              subtitle: "description",
            },
          },
        }),
      ],
      validation: (rule) => rule.max(3),
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Untitled Page Header",
      subtitle: "Page Header",
    }),
  },
});
