import { Star } from "lucide-react";
import { defineField, defineType } from "sanity";

function validateEmbedSocialUrl(value?: string) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.hostname === "embedsocial.com" ||
      url.hostname.endsWith(".embedsocial.com")
      ? true
      : "Use an EmbedSocial URL";
  } catch {
    return "Enter a valid EmbedSocial URL";
  }
}

export default defineType({
  name: "phxEmbedSocialReviews",
  title: "PHX EmbedSocial Reviews",
  type: "object",
  icon: Star,
  description:
    "Homepage reviews section that embeds the existing EmbedSocial Google reviews widget",
  fields: [
    defineField({
      name: "iframeTitle",
      title: "Iframe Title",
      type: "string",
      description:
        "A short accessible title that describes the embedded reviews widget",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "iframeSrc",
      title: "EmbedSocial Iframe URL",
      type: "url",
      description:
        "The EmbedSocial iframe URL for the existing Google reviews widget",
      validation: (rule) =>
        rule
          .required()
          .uri({ scheme: ["https"] })
          .custom(validateEmbedSocialUrl),
    }),
    defineField({
      name: "resizerScriptSrc",
      title: "EmbedSocial Resizer Script URL",
      type: "url",
      description:
        "The EmbedSocial script URL that resizes the reviews iframe after load",
      validation: (rule) =>
        rule.uri({ scheme: ["https"] }).custom(validateEmbedSocialUrl),
    }),
  ],
  preview: {
    select: { title: "iframeTitle" },
    prepare: ({ title }) => ({
      title: title || "Google reviews",
      subtitle: "PHX EmbedSocial Reviews",
    }),
  },
});
