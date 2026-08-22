import { Megaphone } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import { sectionNavField } from "./shared/section-nav.ts";

export default defineType({
  name: "ctaBanner",
  title: "CTA Banner",
  type: "object",
  icon: Megaphone,
  description:
    "A slim dark call-to-action band with a heading, one supporting line, and up to two buttons",
  fields: [
    defineField({
      name: "title",
      type: "string",
      description:
        "The question or statement that prompts visitors to act, such as \"Wondering if now is the right time to lock a rate?\"",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      type: "string",
      description: "Optional supporting sentence shown under the heading",
    }),
    defineField({
      name: "buttons",
      type: "array",
      description:
        "One or two actions. The first button is emphasized; the second renders as an outline.",
      of: [defineArrayMember({ type: "button" })],
      validation: (rule) => rule.required().min(1).max(2),
    }),
    sectionNavField(),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Untitled CTA Banner",
      subtitle: "CTA Banner",
    }),
  },
});
