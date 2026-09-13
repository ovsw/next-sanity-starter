import { groq } from "next-sanity";
import { richTextContentQuery } from "./shared/rich-text-content";

// @sanity-typegen-ignore
export const richTextBlockQuery = groq`
  _type == "richTextBlock" => {
    theme,
    eyebrow,
    title,
    richText[]{
      ${richTextContentQuery}
    }
  }
`;
