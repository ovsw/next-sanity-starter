import { PencilRulerIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

// A Scaffold holds a page's content before a real section exists for it. The
// AI page-build workflow drafts every page as Scaffolds, then replaces each
// one with a section from the project's library and moves the Scaffold to
// the document's `blocksArchive`.
export default defineType({
  name: "scaffold",
  title: "Scaffold",
  type: "object",
  icon: PencilRulerIcon,
  description:
    "A placeholder section that holds the intended content until a real section replaces it.",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      description: "Internal label for this placeholder.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "richText",
      title: "Content",
      type: "richTextContent",
      description:
        "The complete intended content for this section, including images and links.",
    }),
    defineField({
      name: "proposedSectionShape",
      title: "Proposed section shape",
      type: "text",
      rows: 3,
      description:
        "A suggested presentation for the real section that replaces this Scaffold.",
    }),
  ],
  preview: {
    select: { name: "name", shape: "proposedSectionShape" },
    prepare: ({ name, shape }) => ({
      title: name || "Untitled Scaffold",
      subtitle: shape ? `Scaffold: ${shape}` : "Scaffold",
    }),
  },
});
