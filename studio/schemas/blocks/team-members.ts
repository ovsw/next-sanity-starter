import { UsersRound } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import { sectionNavField } from "./shared/section-nav.ts";

export default defineType({
  name: "teamMembers",
  title: "Team Members",
  type: "object",
  icon: UsersRound,
  description:
    "A PHX team section that displays selected Team Member documents.",
  fields: [
    defineField({
      name: "useCreamBackground",
      title: "Use Cream Background",
      type: "boolean",
      description:
        "Turn on to use a cream background for this section. Leave off for white.",
      initialValue: false,
    }),
    defineField({
      name: "eyebrow",
      type: "string",
      title: "Eyebrow",
      description: "Optional short label shown above the section title.",
    }),
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      description: "The main heading for the team section.",
    }),
    defineField({
      name: "richText",
      type: "array",
      title: "Intro Text",
      description:
        "Optional introductory copy shown before the team member profiles.",
      of: [
        defineArrayMember({
          type: "block",
          marks: {
            decorators: [
              { title: "Strong", value: "strong" },
              { title: "Emphasis", value: "em" },
            ],
          },
        }),
      ],
    }),
    defineField({
      name: "members",
      type: "array",
      title: "Members",
      description:
        "The team member profiles to show, in the order they should appear.",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "teamMember" }],
        }),
      ],
      validation: (rule) =>
        rule
          .required()
          .min(1)
          .error("Add at least one team member to this section."),
    }),
    sectionNavField(),
  ],
  preview: {
    select: {
      title: "title",
    },
    prepare: ({ title }) => ({
      title: title || "Team Members",
      subtitle: "Team Members",
    }),
  },
});
