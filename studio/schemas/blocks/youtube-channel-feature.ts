import { PlayCircle as YoutubeIcon } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

type Fact = { label?: string; value?: string };
type YoutubeButton = { label?: string; url?: string };

export function validateFacts(facts: unknown[] | null | undefined) {
  if (facts?.length !== 3) return "Add exactly three facts";

  return facts.every((fact) => {
    const item = fact as Fact;
    return item.value?.trim() && item.label?.trim();
  })
    ? true
    : "Every fact needs both a value and a label";
}

export function validateYoutubeButton(button: YoutubeButton | null | undefined) {
  if (!button?.label?.trim()) return "Add the button label";
  if (!button.url?.trim()) return "Add the YouTube destination";

  try {
    const hostname = new URL(button.url).hostname.replace(/^www\./, "");
    return hostname === "youtube.com" || hostname === "youtu.be"
      ? true
      : "Enter a youtube.com or youtu.be URL";
  } catch {
    return "Enter a valid YouTube URL";
  }
}

const imageWithAlt = ({
  description,
  name,
  required = false,
  title,
}: {
  description: string;
  name: string;
  required?: boolean;
  title: string;
}) =>
  defineField({
    name,
    title,
    type: "image",
    description,
    options: { hotspot: true },
    fields: [
      defineField({
        name: "alt",
        title: "Alt Text",
        type: "string",
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
    validation: required ? (rule) => rule.required() : undefined,
  });

export default defineType({
  name: "youtubeChannelFeature",
  title: "Youtube Channel Feature",
  type: "object",
  icon: YoutubeIcon,
  description: "A dark feature section highlighting an educational YouTube channel",
  fields: [
    defineField({
      name: "eyebrow",
      type: "string",
      description: "The short uppercase label shown above the main heading",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "title",
      type: "string",
      description: "The main heading describing the YouTube channel",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "richText",
      title: "Description",
      type: "array",
      description: "The supporting message shown below the heading",
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
            annotations: [],
          },
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "facts",
      type: "array",
      description: "Three short facts that summarize the channel",
      of: [
        defineArrayMember({
          name: "channelFact",
          title: "Channel Fact",
          type: "object",
          fields: [
            defineField({
              name: "value",
              type: "string",
              description: "The prominent value, such as 1M+ or $0",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "label",
              type: "string",
              description: "The short uppercase explanation of this value",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: { select: { subtitle: "label", title: "value" } },
        }),
      ],
      validation: (rule) => rule.required().custom(validateFacts),
    }),
    imageWithAlt({
      name: "channelImage",
      title: "Channel Screenshot",
      description: "The tall YouTube channel screenshot that scrolls beside the message",
      required: true,
    }),
    imageWithAlt({
      name: "mobileChannelImage",
      title: "Mobile Channel Image",
      description:
        "The static YouTube channel image shown on phones instead of the scrolling screenshot",
    }),
    defineField({
      name: "youtubeButton",
      title: "YouTube Button",
      type: "object",
      description: "The required button that opens the featured YouTube page",
      fields: [
        defineField({
          name: "label",
          type: "string",
          description: "The button text, such as Watch on YouTube",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "url",
          title: "YouTube URL",
          type: "url",
          description: "The YouTube video or channel opened by the button",
          validation: (rule) => rule.required().uri({ scheme: ["https"] }),
        }),
      ],
      validation: (rule) => rule.required().custom(validateYoutubeButton),
    }),
  ],
  preview: {
    select: { media: "channelImage", title: "title" },
    prepare: ({ media, title }) => ({
      media,
      subtitle: "Youtube Channel Feature",
      title: title || "Untitled Youtube Channel Feature",
    }),
  },
});
