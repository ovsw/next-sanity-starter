import { HomeIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

export default defineType({
  name: "homebotWidget",
  title: "HomeBot Widget",
  type: "object",
  icon: HomeIcon,
  description: "Home-value estimate widget powered by HomeBot",
  fields: [
    defineField({
      name: "heading",
      type: "string",
      description: "Optional heading shown above the home-value widget",
    }),
  ],
  preview: {
    select: { title: "heading" },
    prepare: ({ title }) => ({
      title: title || "Home value estimate",
      subtitle: "HomeBot Widget",
    }),
  },
});
