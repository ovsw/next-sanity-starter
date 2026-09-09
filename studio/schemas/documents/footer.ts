import { Columns3, Link, PanelBottom } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import { defineDestinationType } from "../blocks/shared/destination";

const destination = defineDestinationType("footerDestination");

const footerLink = defineType({
  name: "footerLink",
  title: "Footer link",
  type: "object",
  icon: Link,
  fields: [
    defineField({
      name: "label",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "destination", type: "footerDestination" }),
  ],
  preview: { select: { title: "label" } },
});

const footerColumn = defineType({
  name: "footerColumn",
  title: "Footer column",
  type: "object",
  icon: Columns3,
  fields: [
    defineField({
      name: "heading",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "links",
      type: "array",
      of: [defineArrayMember({ type: "footerLink" })],
      validation: (rule) => rule.required().min(1).unique(),
    }),
  ],
  preview: {
    select: { title: "heading", links: "links" },
    prepare: ({ title, links }) => ({
      title,
      subtitle: `${links?.length ?? 0} link${links?.length === 1 ? "" : "s"}`,
    }),
  },
});

const footer = defineType({
  name: "footer",
  title: "Site Footer",
  type: "document",
  icon: PanelBottom,
  fields: [
    defineField({
      name: "intro",
      title: "Introduction",
      type: "text",
      rows: 3,
      description: "A short closing statement shown beside the site identity.",
    }),
    defineField({
      name: "columns",
      title: "Navigation columns",
      type: "array",
      of: [defineArrayMember({ type: "footerColumn" })],
      validation: (rule) => rule.max(4),
    }),
    defineField({
      name: "legalLinks",
      title: "Legal links",
      type: "array",
      of: [defineArrayMember({ type: "footerLink" })],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: "copyrightStartYear",
      title: "Copyright start year",
      type: "number",
      validation: (rule) => rule.required().integer().min(1900),
    }),
    defineField({
      name: "copyrightOwner",
      title: "Copyright owner",
      type: "string",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { prepare: () => ({ title: "Site Footer" }) },
});

export const footerSchemaTypes = [destination, footerLink, footerColumn];

export default footer;
