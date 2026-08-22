import { defineField, defineType } from "sanity";
import { Settings } from "lucide-react";

export default defineType({
  name: "settings",
  title: "Settings",
  type: "document",
  icon: Settings,
  fields: [
    defineField({
      name: "logo",
      title: "Main logo",
      description:
        "The primary brand lockup. Sits at the left of the header, with the secondary logo beside it.",
      type: "object",
      fields: [
        defineField({
          name: "dark",
          type: "image",
          options: { hotspot: true },
        }),
        defineField({
          name: "light",
          type: "image",
          options: { hotspot: true },
        }),
        defineField({
          name: "width",
          type: "number",
          title: "Width",
          description:
            "The width of the logo. Default is dimensions of the image.",
        }),
        defineField({
          name: "height",
          type: "number",
          title: "Height",
          description:
            "The height of the logo. Default is dimensions of the image.",
        }),
      ],
    }),
    defineField({
      name: "secondaryLogo",
      title: "Secondary logo",
      type: "object",
      description:
        "Optional parent-brand or partner mark shown beside the main logo.",
      fields: [
        defineField({
          name: "dark",
          type: "image",
          title: "Dark mode (optional)",
          description:
            "Optional. Leave empty to invert the light asset instead. Multi-color marks rarely invert cleanly, so supply a dedicated file once one is available.",
          options: { hotspot: true },
        }),
        defineField({
          name: "light",
          type: "image",
          title: "Light mode",
          description:
            "Compact horizontal lockup. Used on light backgrounds, and inverted for dark mode until a dedicated dark asset is supplied.",
          options: { hotspot: true },
        }),
        defineField({
          name: "width",
          type: "number",
          title: "Width",
          description:
            "The width of the logo. Default is dimensions of the image.",
        }),
        defineField({
          name: "height",
          type: "number",
          title: "Height",
          description:
            "The height of the logo. Default is dimensions of the image.",
        }),
      ],
    }),
    defineField({
      name: "siteName",
      type: "string",
      description: "The public site name used in visible branding.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "blogPostSidebar",
      title: "Blog Post Sidebar",
      type: "blogPostSidebar",
      deprecated: {
        reason: "Moved to Blog > Blog Post Settings.",
      },
      hidden: true,
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: "siteName",
      media: "logo",
    },
    prepare({ title, media }) {
      return {
        title: title || "Site Settings",
        media,
      };
    },
  },
});
