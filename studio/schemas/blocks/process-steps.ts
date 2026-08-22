import { ListOrdered } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

const processStep = defineArrayMember({
  name: "phxProcessStep",
  title: "Step",
  type: "object",
  fields: [
    defineField({
      name: "title",
      type: "string",
      description: "The step heading, such as \"Submit an application\"",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "summary",
      type: "string",
      description: "The short line under the heading that sums up the step",
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "simpleRichText",
      description:
        "The explanation for this step. Paragraphs with bold and italic only.",
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "summary" },
    prepare: ({ title, subtitle }) => ({
      title: title || "Untitled Step",
      subtitle: subtitle || "Step",
    }),
  },
});

export default defineType({
  name: "processSteps",
  title: "Process Steps",
  type: "object",
  icon: ListOrdered,
  description:
    "A numbered list of steps beside a heading, for explaining how a process works",
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
      description: "Optional text shown above the section title",
    }),
    defineField({
      name: "title",
      type: "string",
      description: "The main heading for the process section",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "intro",
      type: "text",
      rows: 4,
      description: "Optional paragraph shown under the section heading",
    }),
    defineField({
      name: "steps",
      type: "array",
      description:
        "The steps in the process. They are numbered automatically in the order listed here.",
      of: [processStep],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: { title: "title", steps: "steps" },
    prepare: ({ title, steps }) => {
      const count = Array.isArray(steps) ? steps.length : 0;
      return {
        title: title || "Untitled Process Steps",
        subtitle: `Process Steps — ${count} ${count === 1 ? "step" : "steps"}`,
      };
    },
  },
});
