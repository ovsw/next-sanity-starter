import { ListChecks } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import { sectionNavField } from "./shared/section-nav.ts";

type EvidenceModule = { _type?: string };

function validateEvidence(value: EvidenceModule[] | undefined) {
  return value?.length === 1
    ? true
    : "Each chapter needs exactly one evidence module";
}

const statRow = defineArrayMember({
  name: "requirementStatRow",
  title: "Stat Row",
  type: "object",
  fields: [
    defineField({
      name: "stats",
      type: "array",
      description:
        "One to three headline figures, such as \"620+ / Minimum credit score\"",
      of: [
        defineArrayMember({
          name: "stat",
          title: "Stat",
          type: "object",
          fields: [
            defineField({
              name: "value",
              type: "string",
              description: "The figure itself, such as \"$0\" or \"3.5%\"",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "label",
              type: "string",
              description: "The caption under the figure, such as \"Down payment\"",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: { title: "value", subtitle: "label" },
          },
        }),
      ],
      validation: (rule) => rule.required().min(1).max(3),
    }),
  ],
  preview: {
    select: { stats: "stats" },
    prepare: ({ stats }) => ({
      title: "Stat Row",
      subtitle: Array.isArray(stats)
        ? stats.map((stat) => stat?.value).filter(Boolean).join(" · ")
        : undefined,
    }),
  },
});

const tierList = defineArrayMember({
  name: "requirementTierList",
  title: "Tier List",
  type: "object",
  fields: [
    defineField({
      name: "tiers",
      type: "array",
      description:
        "Rows of condition and answer, such as \"First-time home buyers / 3%\"",
      of: [
        defineArrayMember({
          name: "tier",
          title: "Tier",
          type: "object",
          fields: [
            defineField({
              name: "label",
              type: "string",
              description: "The condition, such as \"Credit score 580 or higher\"",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "value",
              type: "string",
              description: "The answer, such as \"3.5% down\"",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: { title: "label", subtitle: "value" },
          },
        }),
      ],
      validation: (rule) => rule.required().min(2).max(6),
    }),
  ],
  preview: {
    select: { tiers: "tiers" },
    prepare: ({ tiers }) => ({
      title: "Tier List",
      subtitle: `${Array.isArray(tiers) ? tiers.length : 0} tiers`,
    }),
  },
});

const checklist = defineArrayMember({
  name: "requirementChecklist",
  title: "Checklist",
  type: "object",
  fields: [
    defineField({
      name: "items",
      type: "array",
      description:
        "Two to five checkmarked items. Bold the lead phrase of each item.",
      of: [
        defineArrayMember({
          name: "checklistItem",
          title: "Checklist Item",
          type: "object",
          fields: [
            defineField({
              name: "body",
              type: "simpleRichText",
              description:
                "One item, such as \"DD-214, unless you're currently on active duty\" with the lead phrase bolded",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: { body: "body" },
            prepare: ({ body }) => {
              const firstBlock = Array.isArray(body) ? body[0] : undefined;
              const text = firstBlock?.children
                ?.map((child: { text?: string }) => child.text)
                .join("");
              return { title: text || "Checklist Item" };
            },
          },
        }),
      ],
      validation: (rule) => rule.required().min(2).max(5),
    }),
  ],
  preview: {
    select: { items: "items" },
    prepare: ({ items }) => ({
      title: "Checklist",
      subtitle: `${Array.isArray(items) ? items.length : 0} items`,
    }),
  },
});

const chapter = defineArrayMember({
  name: "requirementChapter",
  title: "Chapter",
  type: "object",
  fields: [
    defineField({
      name: "kicker",
      type: "string",
      description:
        "Small uppercase label above the chapter title, such as \"The money up front\"",
    }),
    defineField({
      name: "title",
      type: "string",
      description: "The chapter heading, such as \"Less than you think\"",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "simpleRichText",
      description: "The prose shown beside the evidence module",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "evidence",
      type: "array",
      description:
        "Exactly one module shown beside the prose: a stat row, a tier list, or a checklist",
      of: [statRow, tierList, checklist],
      validation: (rule) => rule.custom(validateEvidence),
    }),
    defineField({
      name: "note",
      title: "Footnote",
      type: "text",
      rows: 2,
      description:
        "Optional fine print under the evidence module, such as \"95% LTV means 5% down\"",
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "kicker" },
    prepare: ({ title, subtitle }) => ({
      title: title || "Untitled Chapter",
      subtitle: subtitle || "Chapter",
    }),
  },
});

export default defineType({
  name: "loanRequirements",
  title: "Loan Requirements",
  type: "object",
  icon: ListChecks,
  description:
    "Loan eligibility told as chapters: prose beside a stat row, tier list, or checklist",
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
      description: "The main heading, such as \"What it takes to qualify\"",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "intro",
      type: "text",
      rows: 4,
      description: "Optional paragraph shown under the section heading",
    }),
    defineField({
      name: "chapters",
      type: "array",
      description: "Two to five requirement chapters",
      of: [chapter],
      validation: (rule) => rule.required().min(2).max(5),
    }),
    defineField({
      name: "closingNote",
      title: "Closing Note",
      type: "text",
      rows: 2,
      description:
        "Optional short line under the chapters, such as \"Close on one of these but not all? That's normal.\"",
    }),
    defineField({
      name: "closingLink",
      title: "Closing Link",
      type: "button",
      description:
        "Optional action beside the closing note. Renders as a text link; the variant setting is ignored.",
    }),
    sectionNavField(),
  ],
  preview: {
    select: { title: "title", chapters: "chapters" },
    prepare: ({ title, chapters }) => {
      const count = Array.isArray(chapters) ? chapters.length : 0;
      return {
        title: title || "Untitled Loan Requirements",
        subtitle: `Loan Requirements — ${count} ${count === 1 ? "chapter" : "chapters"}`,
      };
    },
  },
});
