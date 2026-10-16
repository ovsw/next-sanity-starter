import { LinkIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

export default defineType({
  name: "buttonLink",
  title: "Button Link",
  type: "object",
  icon: LinkIcon,
  fields: [
    defineField({
      name: "customLink",
      title: "Button Destination",
      type: "customUrl",
      validation: (rule) => rule.required(),
    }),
  ],
});
