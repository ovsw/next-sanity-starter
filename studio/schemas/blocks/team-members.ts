import { UsersRound } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import sectionTheme from "./shared/section-theme";

export default defineType({
  name: "teamMembers",
  title: "Team Members",
  type: "object",
  icon: UsersRound,
  description: "A team section that displays selected Team Member documents.",
  fields: [
    sectionTheme,
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
          styles: [{ title: "Normal", value: "normal" }],
          lists: [],
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
