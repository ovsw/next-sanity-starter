import { Home } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

const imageWithAlt = (name: string, title: string, description: string) =>
  defineField({
    name,
    title,
    type: "image",
    description,
    options: { hotspot: true },
    fields: [
      defineField({
        name: "alt",
        title: "Alternative Text",
        type: "string",
      }),
    ],
  });

export default defineType({
  name: "homeHero",
  title: "Home Hero",
  type: "object",
  icon: Home,
  description: "The primary hero section for the homepage",
  fields: [
    defineField({
      name: "marketPositioning",
      title: "Market Positioning",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "servicePromise",
      title: "Service Promise",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "richText",
      title: "Supporting Message",
      type: "array",
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
    imageWithAlt(
      "portraitImage",
      "Portrait Image",
      "The portrait image shown in the hero",
    ),
    imageWithAlt(
      "backgroundImage",
      "Background Image",
      "The wide background image shown behind the hero",
    ),
    imageWithAlt(
      "mobileBackgroundImage",
      "Mobile Background Image",
      "The background image used on narrow screens",
    ),
  ],
  preview: {
    select: { title: "marketPositioning", media: "portraitImage" },
    prepare: ({ title, media }) => ({
      title: title || "Untitled Home Hero",
      subtitle: "Home Hero",
      media,
    }),
  },
});
