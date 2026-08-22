import { groq } from "next-sanity";
import { simpleRichTextQuery } from "./shared/simple-rich-text";

// @sanity-typegen-ignore
export const comparisonTableQuery = groq`
  _type == "comparisonTable" => {
    useCreamBackground,
    eyebrow,
    title,
    intro,
    tableLabel,
    "table": table{
      "rows": array::compact(rows[]{
        _key,
        cells
      })
    },
    cardsLabel,
    "cards": array::compact(cards[]{
      _key,
      _type,
      eyebrow,
      title,
      body[]{
        ${simpleRichTextQuery}
      }
    }),
    note[]{
      ${simpleRichTextQuery}
    }
  }
`;
