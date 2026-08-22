import { defineField, defineType } from "sanity";

const safeProtocols = new Set(["http:", "https:", "mailto:", "tel:"]);

function validateExternalUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return "Add the external URL";
  }

  const href = value.trim();
  if (
    href.startsWith("#") ||
    (href.startsWith("/") && !href.startsWith("//") && href[1] !== "\\")
  ) {
    return true;
  }

  try {
    const url = new URL(href);
    if (["http:", "https:"].includes(url.protocol) && !/^https?:\/\//i.test(href)) {
      return "Enter a valid URL";
    }
    return safeProtocols.has(url.protocol)
      ? true
      : "Use an http, https, mailto, or tel URL";
  } catch {
    return "Enter a valid URL";
  }
}

export default defineType({
  name: "customUrl",
  title: "URL",
  type: "object",
  fields: [
    defineField({
      name: "external",
      title: "External URL",
      type: "string",
      hidden: ({ parent }) => parent?.type !== "external",
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { type?: string } | undefined;
          return parent?.type === "external" ? validateExternalUrl(value) : true;
        }),
    }),
    defineField({
      name: "internal",
      title: "Internal Page",
      type: "reference",
      to: [{ type: "homePage" }, { type: "page" }, { type: "post" }],
      hidden: ({ parent }) => parent?.type !== "internal",
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { type?: string } | undefined;
          return parent?.type === "internal" && !value
            ? "Select the internal page"
            : true;
        }),
    }),
    defineField({
      name: "type",
      type: "string",
      initialValue: "internal",
      options: {
        layout: "radio",
        list: [
          { title: "Internal", value: "internal" },
          { title: "External", value: "external" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "openInNewTab",
      title: "Open in new tab",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "href",
      type: "string",
      hidden: true,
      readOnly: true,
    }),
  ],
});
