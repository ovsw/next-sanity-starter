import { defineField, defineType } from "sanity";

export default defineType({
  name: "section-nav",
  title: "Quick Nav",
  type: "object",
  description:
    "Add a label to include this section in the page's quick nav bar",
  fields: [
    defineField({
      name: "navLabel",
      type: "string",
      title: "Quick nav label",
      description:
        'Optional. Add a short label, e.g. "Why refinance", to include this section in the quick nav. Leave blank to omit it. Also used for the section\'s link anchor.',
      validation: (rule) =>
        rule
          .max(40)
          .warning("Keep quick nav labels short — 40 characters or less."),
    }),
  ],
});

/** Attach the optional quick-nav label to a section block. */
export function sectionNavField() {
  return defineField({
    name: "sectionNav",
    title: "Quick Nav",
    type: "section-nav",
  });
}
