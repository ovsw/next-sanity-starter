import { defineField, defineType } from "sanity";
import { Files } from "lucide-react";
import meta from "../blocks/shared/meta";
import { blocksField } from "../blocks/page-builder";
import { uniqueRootSlug } from "../validation/unique-root-slug";

export default defineType({
  name: "page",
  type: "document",
  title: "Page",
  icon: Files,
  orderings: [
    {
      title: "Title (A–Z)",
      name: "titleAsc",
      by: [{ field: "title", direction: "asc" }],
    },
    {
      title: "Title (Z–A)",
      name: "titleDesc",
      by: [{ field: "title", direction: "desc" }],
    },
    {
      title: "Last updated (newest)",
      name: "updatedAtDesc",
      by: [{ field: "_updatedAt", direction: "desc" }],
    },
    {
      title: "Last updated (oldest)",
      name: "updatedAtAsc",
      by: [{ field: "_updatedAt", direction: "asc" }],
    },
    {
      title: "Created (newest)",
      name: "createdAtDesc",
      by: [{ field: "_createdAt", direction: "desc" }],
    },
    {
      title: "Created (oldest)",
      name: "createdAtAsc",
      by: [{ field: "_createdAt", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "slug.current",
    },
  },
  groups: [
    {
      name: "content",
      title: "Content",
    },
    {
      name: "seo",
      title: "SEO",
    },
    {
      name: "settings",
      title: "Settings",
    },
  ],
  fields: [
    defineField({ name: "title", type: "string", group: "content" }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
      group: "content",
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "settings",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required().custom(uniqueRootSlug),
    }),
    defineField({
      name: "showQuickNav",
      title: "Show quick nav",
      type: "boolean",
      group: "settings",
      initialValue: true,
      description:
        "Show a sticky “On this page” quick nav below the hero. It only appears when at least two sections have a quick nav label.",
    }),
    defineField({
      name: "loanType",
      title: "Loan type",
      type: "string",
      group: "settings",
      description:
        "Set only on pages describing a single loan product. Drives automatic structured data (SEO). Leave empty otherwise.",
      options: {
        list: [
          "VA Loan",
          "FHA Loan",
          "Conventional Loan",
          "Jumbo Loan",
          "USDA Loan",
          "Construction-to-Permanent Loan",
          "Adjustable-Rate Mortgage (ARM)",
          "Refinance Loan",
        ],
      },
    }),
    blocksField,
    meta,
  ],
});
