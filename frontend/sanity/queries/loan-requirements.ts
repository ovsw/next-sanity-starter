import { groq } from "next-sanity";
import { urlInternalHref } from "./shared/internal-href";
import { simpleRichTextQuery } from "./shared/simple-rich-text";

// @sanity-typegen-ignore
export const loanRequirementsQuery = groq`
  _type == "loanRequirements" => {
    useCreamBackground,
    eyebrow,
    title,
    intro,
    "chapters": array::compact(chapters[]{
      _key,
      kicker,
      title,
      body[]{
        ${simpleRichTextQuery}
      },
      "evidence": array::compact(evidence[]{
        _key,
        _type,
        _type == "requirementStatRow" => {
          "stats": array::compact(stats[]{
            _key,
            value,
            label
          })
        },
        _type == "requirementTierList" => {
          "tiers": array::compact(tiers[]{
            _key,
            label,
            value
          })
        },
        _type == "requirementChecklist" => {
          "items": array::compact(items[]{
            _key,
            body[]{
              ${simpleRichTextQuery}
            }
          })
        }
      }),
      note
    }),
    closingNote,
    "closingLink": closingLink{
      text,
      "openInNewTab": url.openInNewTab,
      "href": select(
        url.type == "internal" => ${urlInternalHref},
        url.type == "external" => url.external,
        url.href
      )
    }
  }
`;
