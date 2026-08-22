import { defineField } from "sanity";
import { getSeoTitleWarnings } from "../../../../shared/seo-title";
import { studioSiteName } from "../../../site-name";
import { SeoTitleInput } from "../../inputs/seo-title-input";

export default defineField({
  name: "meta",
  title: "Meta",
  type: "object",
  group: "seo",
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "SEO title override",
      description:
        `Optional. Titles without a pipe get “| ${studioSiteName}” automatically. Titles containing a pipe are used as written.`,
      components: { input: SeoTitleInput },
      validation: (rule) =>
        rule
          .custom((value, context) => {
            const fallbackTitle =
              typeof context.document?.title === "string"
                ? context.document.title
                : undefined;
            const warnings = getSeoTitleWarnings({
              fallbackTitle,
              overrideTitle: value,
              siteName: studioSiteName,
            });

            return warnings.length ? warnings.join(" ") : true;
          })
          .warning(),
    }),
    defineField({
      name: "description",
      type: "text",
      title: "Description",
    }),
    defineField({
      name: "noindex",
      title: "No Index",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "image",
      type: "image",
      title: "Image",
    }),
  ],
});
