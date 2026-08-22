import { Award } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "awardCta",
  title: "Award CTA",
  type: "object",
  icon: Award,
  description:
    "Homepage award call-to-action that preserves the Mortgage Executive Magazine trust signal",
  fields: [
    defineField({
      name: "highlight",
      type: "string",
      description: "The emphasized award phrase, such as TOP 1%",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "title",
      type: "string",
      description: "The main award statement shown next to the highlight",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      type: "string",
      description:
        "Supporting award attribution, including the publication and year",
    }),
    defineField({
      name: "buttons",
      type: "array",
      description:
        "Add one or more clickable buttons that visitors can use to learn about the award",
      of: [defineArrayMember({ type: "button" })],
    }),
  ],
  preview: {
    select: { highlight: "highlight", title: "title" },
    prepare: ({ highlight, title }) => ({
      title: [highlight, title].filter(Boolean).join(" ") || "Award CTA",
      subtitle: "Award CTA",
    }),
  },
});
