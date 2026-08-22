import { Table2 } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import ComparisonTableInput from "../inputs/comparison-table-input";

type TableValue = {
  rows?: { cells?: string[] }[];
};

const comparisonCard = defineArrayMember({
  name: "phxComparisonCard",
  title: "Card",
  type: "object",
  fields: [
    defineField({
      name: "eyebrow",
      type: "string",
      description: "Small label above the card title, such as \"Tap your equity\"",
    }),
    defineField({
      name: "title",
      type: "string",
      description: "The card heading, such as \"Cash-Out Refinance\"",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "simpleRichText",
      description: "The explanation for this option",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "eyebrow" },
    prepare: ({ title, subtitle }) => ({
      title: title || "Untitled Card",
      subtitle: subtitle || "Card",
    }),
  },
});

export default defineType({
  name: "comparisonTable",
  title: "Comparison Table",
  type: "object",
  icon: Table2,
  description:
    "A side-by-side comparison table, with optional companion cards and closing note",
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
      description: "The main heading for the comparison section",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "intro",
      type: "text",
      rows: 4,
      description: "Optional paragraph shown under the section heading",
    }),
    defineField({
      name: "tableLabel",
      title: "Table Label",
      type: "string",
      description:
        "Optional small label above the table, such as \"Fixed-rate term comparison\"",
    }),
    defineField({
      name: "table",
      title: "Table",
      type: "object",
      description:
        "The first row is the header row: its first cell labels the feature " +
        "column (e.g. \"Feature\"), and each option cell can use the form " +
        "\"Eyebrow|Title\" (e.g. \"Fixed-rate|15-Year\") to show a small label " +
        "above the option name. In the rows below, the first cell is the " +
        "feature label. Type — for an empty value.",
      components: { input: ComparisonTableInput },
      fields: [
        defineField({
          name: "rows",
          title: "Rows",
          type: "array",
          of: [
            defineArrayMember({
              name: "tableRow",
              title: "Table Row",
              type: "object",
              fields: [
                defineField({
                  name: "cells",
                  title: "Cells",
                  type: "array",
                  of: [defineArrayMember({ type: "string" })],
                }),
              ],
            }),
          ],
        }),
      ],
      validation: (rule) =>
        rule.required().custom((value) => {
          const rows = (value as TableValue | undefined)?.rows ?? [];
          if (rows.length < 2) {
            return "Add a header row plus at least one feature row";
          }
          const width = rows[0]?.cells?.length ?? 0;
          if (width < 2) {
            return "The table needs a feature column plus at least one option column";
          }
          if (rows.some((row) => (row.cells?.length ?? 0) !== width)) {
            return "Every row must have the same number of cells";
          }
          return true;
        }),
    }),
    defineField({
      name: "cardsLabel",
      title: "Cards Label",
      type: "string",
      description:
        "Optional small label above the companion cards, such as \"Other refinance structures\"",
    }),
    defineField({
      name: "cards",
      type: "array",
      description:
        "Optional cards for related options that don't fit the table",
      of: [comparisonCard],
    }),
    defineField({
      name: "note",
      title: "Closing Note",
      type: "simpleRichText",
      description:
        "Optional short note under the section, e.g. pointing readers to an advisor. Supports inline links.",
    }),
  ],
  preview: {
    select: { title: "title", rows: "table.rows" },
    prepare: ({ title, rows }) => {
      const count = Array.isArray(rows) ? Math.max(rows.length - 1, 0) : 0;
      return {
        title: title || "Untitled Comparison Table",
        subtitle: `Comparison Table — ${count} ${count === 1 ? "feature" : "features"}`,
      };
    },
  },
});
