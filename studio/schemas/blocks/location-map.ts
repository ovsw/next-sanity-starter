import { MapPinned } from "lucide-react";
import { defineField, defineType } from "sanity";

export function validateGoogleMapsEmbedUrl(
  value: string | null | undefined,
): true | string {
  if (!value) return true;

  try {
    const url = new URL(value);
    const isGoogleHost =
      url.hostname === "google.com" || url.hostname.endsWith(".google.com");
    const isEmbed =
      url.pathname.startsWith("/maps/embed") ||
      (url.pathname.startsWith("/maps") && url.searchParams.get("output") === "embed");

    return isGoogleHost && isEmbed ? true : "Enter a Google Maps embed URL";
  } catch {
    return "Enter a Google Maps embed URL";
  }
}

const requiredString = (description: string, name: string, max: number) =>
  defineField({
    name,
    type: "string",
    description,
    validation: (rule) => rule.required().max(max),
  });

export default defineType({
  name: "locationMap",
  title: "Location Map",
  type: "object",
  icon: MapPinned,
  description: "A landmark photo, business address, directions link, and embedded map",
  fields: [
    defineField({
      name: "useCreamBackground",
      title: "Use Cream Background",
      type: "boolean",
      description: "Turn on to use a cream background for this section. Leave off for white.",
      initialValue: false,
    }),
    requiredString(
      "The short uppercase label shown above the section heading",
      "eyebrow",
      40,
    ),
    requiredString("The main heading that introduces this location", "title", 100),
    requiredString(
      "The text visitors select to open turn-by-turn directions",
      "directionsLabel",
      40,
    ),
    defineField({
      name: "directionsUrl",
      title: "Directions URL",
      type: "url",
      description:
        "The Google Maps or mapping-service link that opens directions to this location",
      validation: (rule) =>
        rule
          .required()
          .uri({ scheme: ["http", "https"] })
          .error("Enter a complete http or https directions URL"),
    }),
    defineField({
      name: "image",
      type: "image",
      title: "Image",
      description:
        "A recognizable landmark photo that helps visitors identify the location. Add alt text and use the hotspot tool to preserve its focal point when cropped.",
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
    requiredString(
      "The short uppercase label shown over the landmark photo",
      "imageEyebrow",
      60,
    ),
    requiredString("The landmark name shown over the photo", "imageTitle", 100),
    defineField({
      name: "mapEmbedUrl",
      title: "Google Maps Embed URL",
      type: "url",
      description: "The Google Maps embed URL displayed inside the location card",
      validation: (rule) =>
        rule.required().uri({ scheme: ["https"] }).custom(validateGoogleMapsEmbedUrl),
    }),
    requiredString(
      "A concise accessible title that describes the embedded map",
      "mapTitle",
      120,
    ),
    requiredString("The public business name shown on the map card", "businessName", 100),
    requiredString(
      "The license or credential line shown beneath the business name",
      "credentialLine",
      100,
    ),
    defineField({
      name: "address",
      type: "object",
      description: "The postal address shown on the map card",
      fields: [
        requiredString("The street number, street name, and suite or unit", "street", 100),
        requiredString("The city or locality", "city", 60),
        requiredString("The state, province, or regional abbreviation", "region", 40),
        requiredString("The postal or ZIP code", "postalCode", 20),
        requiredString("The country name", "country", 60),
      ],
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { media: "image", title: "title" },
    prepare: ({ media, title }) => ({
      media,
      subtitle: "Location Map",
      title: title || "Untitled Location Map",
    }),
  },
});
