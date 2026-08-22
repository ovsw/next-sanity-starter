import { BookOpenText } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

const storyRichTextField = defineField({
  name: "richText",
  title: "Narrative",
  type: "array",
  description: "The main story. Use Pull Quote to emphasize one important statement.",
  of: [
    defineArrayMember({
      name: "block",
      type: "block",
      styles: [
        { title: "Normal", value: "normal" },
        { title: "Pull Quote", value: "blockquote" },
      ],
      lists: [
        { title: "Bullet", value: "bullet" },
        { title: "Numbered", value: "number" },
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
  ],
  validation: (rule) =>
    rule.required().custom((value: Array<{ style?: string }> | undefined) => {
      const pullQuotes = value?.filter((block) => block.style === "blockquote").length ?? 0;

      return pullQuotes <= 1 ? true : "Use no more than one pull quote in this story";
    }),
});

export default defineType({
  name: "storyFeature",
  title: "Image and Text",
  type: "object",
  icon: BookOpenText,
  description:
    "A reusable image-and-text section for a story, service, or point of view.",
  initialValue: {
    eyebrow: "Story",
    title: "Pair a useful image with clear editorial context.",
    richText: [
      {
        _key: "starter-image-text-body",
        _type: "block",
        children: [
          {
            _key: "starter-image-text-span",
            _type: "span",
            marks: [],
            text: "Replace this sample with the context visitors need before they continue.",
          },
        ],
        markDefs: [],
        style: "normal",
      },
    ],
  },
  fields: [
    defineField({
      name: "useCreamBackground",
      title: "Use Alternate Background",
      type: "boolean",
      description:
        "Turn on to separate this section from the surrounding page content.",
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
      description: "The main heading for this story",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "image",
      type: "image",
      title: "Image",
      description:
        "The main story image. Add alt text and use the hotspot tool to preserve its focal point when cropped.",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Alt Text",
          description: "The text that describes the image for screen readers and search engines",
          validation: (rule) =>
            rule.custom((value, context) => {
              const parent = context.parent as { asset?: unknown };
              return parent?.asset && !value?.trim()
                ? "Alt text is required when an image is set"
                : true;
            }),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "imageCaption",
      title: "Image Caption",
      type: "string",
      description: "Optional context shown directly beneath the image",
    }),
    storyRichTextField,
    defineField({
      name: "keyDetails",
      title: "Key Details",
      type: "object",
      description: "Optional short facts shown as non-interactive pills",
      fields: [
        defineField({
          name: "title",
          type: "string",
          description: "Optional label shown above the key details",
        }),
        defineField({
          name: "items",
          type: "array",
          description: "Short facts to display as pills",
          of: [defineArrayMember({ type: "string" })],
          validation: (rule) => rule.required().min(1).max(8),
        }),
      ],
    }),
    defineField({
      name: "buttons",
      title: "Buttons",
      type: "array",
      description: "Optional actions shown after the story",
      of: [defineArrayMember({ type: "button" })],
      validation: (rule) => rule.max(2),
    }),
  ],
  preview: {
    select: { title: "title", media: "image" },
    prepare: ({ title, media }) => ({
      title: title || "Untitled Image and Text",
      subtitle: "Image and Text",
      media,
    }),
  },
});
