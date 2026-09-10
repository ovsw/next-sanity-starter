import { imageQuery } from "./shared/image";
import { groq } from "next-sanity";
import { simpleRichTextQuery } from "./shared/simple-rich-text";

// @sanity-typegen-ignore
export const benefitCardsQuery = groq`
  _type == "benefitCards" => {
    title,
    "cards": array::compact(cards[]{
      image { ${imageQuery} },
      _key,
      _type,
      "icon": icon{ name, svg },
      title,
      body[]{
        ${simpleRichTextQuery}
      }
    })
  }
`;
