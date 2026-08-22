import { PlayCircle } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import { sectionNavField } from "./shared/section-nav.ts";

export default defineType({
  name: "videoFeature",
  title: "Video Feature",
  type: "object",
  icon: PlayCircle,
  description: "A featured video with supporting copy and actions",
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
      description: "The main heading for this video section",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "richText",
      title: "Supporting Message",
      type: "array",
      description: "The supporting message shown beside the featured video",
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
      name: "buttons",
      type: "array",
      of: [defineArrayMember({ type: "button" })],
    }),
    defineField({
      name: "youtubeUrl",
      title: "YouTube URL",
      type: "url",
      description: "The YouTube video URL to embed",
      validation: (rule) => rule.uri({ scheme: ["https"] }).required(),
    }),
    defineField({
      name: "thumbnailImage",
      title: "Thumbnail Image",
      type: "image",
      description:
        "The image that represents the video when embeds are not available",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alternative Text",
          type: "string",
        }),
      ],
    }),
    sectionNavField(),
  ],
  preview: {
    select: {
      title: "title",
      media: "thumbnailImage",
    },
    prepare: ({ title, media }) => ({
      title: title || "Untitled Video Feature",
      subtitle: "Video Feature",
      media,
    }),
  },
});
