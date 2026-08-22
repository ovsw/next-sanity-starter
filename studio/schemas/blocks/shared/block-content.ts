import { defineArrayMember, defineField, defineType } from "sanity";
import { SquarePlay } from "lucide-react";
import { YouTubePreview } from "../../previews/youtube-preview";

export default defineType({
  title: "Block Content",
  name: "block-content",
  type: "array",
  of: [
    defineArrayMember({
      title: "Block",
      type: "block",
      styles: [
        { title: "Normal", value: "normal" },
        { title: "H1", value: "h1" },
        { title: "H2", value: "h2" },
        { title: "H3", value: "h3" },
        { title: "H4", value: "h4" },
        { title: "Quote", value: "blockquote" },
      ],
      lists: [
        { title: "Bullet", value: "bullet" },
        { title: "Number", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Strong", value: "strong" },
          { title: "Emphasis", value: "em" },
        ],
        annotations: [
          defineArrayMember({ type: "customLink" }),
        ],
      },
    }),
    defineArrayMember({
      type: "image",
      options: { hotspot: true },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative Text",
        },
      ],
    }),
    defineArrayMember({
      name: "youtube",
      type: "object",
      title: "YouTube",
      icon: SquarePlay,
      fields: [
        defineField({
          name: "videoId",
          title: "Video ID",
          type: "string",
          description: "YouTube Video ID",
        }),
        defineField({
          name: "title",
          type: "string",
          description:
            "Optional. Used as the VideoObject name for structured data.",
        }),
        defineField({
          name: "description",
          type: "text",
          rows: 3,
          description: "Optional VideoObject description.",
        }),
        defineField({
          name: "publishedAt",
          title: "Video Publish Date",
          type: "date",
          description:
            "Optional. Required with a title for VideoObject structured data.",
        }),
        defineField({
          name: "duration",
          title: "Video Duration",
          type: "string",
          description:
            "Optional ISO 8601 duration for structured data, such as PT2M30S.",
          validation: (rule) =>
            rule.custom((value) =>
              !value || /^PT(?=\d)(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.test(value)
                ? true
                : "Use an ISO 8601 duration such as PT2M30S",
            ),
        }),
        defineField({
          name: "thumbnailImage",
          title: "Thumbnail Image",
          type: "image",
          description:
            "Optional. The YouTube thumbnail is used when this is empty.",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Alternative Text",
              type: "string",
            }),
          ],
        }),
      ],
      preview: {
        select: {
          title: "videoId",
        },
      },
      components: {
        preview: YouTubePreview,
      },
    }),
  ],
});
