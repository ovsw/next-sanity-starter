import { BookOpenText } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import { sectionNavField } from "./shared/section-nav.ts";

type SupportingModule = { _type?: string };

function validateProofPointCount(value: unknown[] | undefined) {
  return value && value.length >= 2 && value.length <= 3
    ? true
    : "Add two or three proof points";
}

function validateSupportingContent(value: SupportingModule[] | undefined) {
  if ((value?.length ?? 0) > 2) {
    return "Use no more than two supporting modules";
  }

  const types = value?.map((item) => item._type).filter(Boolean) ?? [];
  return new Set(types).size === types.length
    ? true
    : "Use each supporting module type no more than once";
}

const quoteCallout = defineArrayMember({
  name: "quoteCallout",
  title: "Quote Callout",
  type: "object",
  fields: [
    defineField({
      name: "quote",
      type: "text",
      rows: 3,
      description: "The statement to emphasize as a quotation",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "context",
      type: "string",
      description: "Optional context shown beneath the quotation",
    }),
  ],
  preview: {
    select: { title: "quote", subtitle: "context" },
    prepare: ({ subtitle, title }) => ({
      title: title || "Untitled quote",
      subtitle: subtitle || "Quote Callout",
    }),
  },
});

const proofPoint = defineArrayMember({
  name: "proofPoint",
  title: "Proof Point",
  type: "object",
  fields: [
    defineField({
      name: "title",
      type: "string",
      description: "The concise claim or accomplishment",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 3,
      description: "Brief evidence or context supporting this claim",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "description" },
  },
});

const proofPoints = defineArrayMember({
  name: "proofPoints",
  title: "Proof Points",
  type: "object",
  fields: [
    defineField({
      name: "items",
      type: "array",
      description: "Two or three concise accomplishments shown as columns",
      of: [proofPoint],
      validation: (rule) => rule.custom(validateProofPointCount),
    }),
  ],
  preview: {
    select: { items: "items" },
    prepare: ({ items }) => ({
      title: "Proof Points",
      subtitle: `${items?.length ?? 0} items`,
    }),
  },
});

const impactStatement = defineArrayMember({
  name: "impactStatement",
  title: "Impact Statement",
  type: "object",
  fields: [
    defineField({
      name: "statement",
      type: "string",
      description: "The outcome or value shown most prominently",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "label",
      type: "string",
      description: "A short phrase completing or qualifying the statement",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 4,
      description: "A concise explanation of the impact",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: "statement", subtitle: "label" },
  },
});

export default defineType({
  name: "editorialChapter",
  title: "Editorial Chapter",
  type: "object",
  icon: BookOpenText,
  description:
    "A two-column narrative chapter with optional editorial supporting content",
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
      description: "Optional short label shown above the section heading",
    }),
    defineField({
      name: "title",
      type: "string",
      description: "The main heading for this chapter",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "richText",
      title: "Narrative",
      type: "array",
      description: "The main narrative for this chapter",
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
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "supportingContent",
      type: "array",
      description:
        "Up to two distinct supporting modules, ordered as they should appear",
      of: [quoteCallout, proofPoints, impactStatement],
      validation: (rule) => rule.custom(validateSupportingContent),
    }),
    sectionNavField(),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Untitled Editorial Chapter",
      subtitle: "Editorial Chapter",
    }),
  },
});
