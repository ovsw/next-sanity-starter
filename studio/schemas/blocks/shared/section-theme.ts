import { defineField } from "sanity";

export const sectionThemeValues = [
  { title: "Light", value: "light" },
  { title: "Dark", value: "dark" },
] as const;

export default defineField({
  name: "theme",
  title: "Theme",
  type: "string",
  description: "Groups this section with nearby content.",
  options: { list: [...sectionThemeValues] },
  initialValue: "light",
  validation: (rule) =>
    rule.required().custom((value) =>
      value === "light" || value === "dark" ? true : "Choose Light or Dark.",
    ),
});
