import { groq } from "next-sanity";
import { richTextContentQuery } from "./shared/rich-text-content";

// @sanity-typegen-ignore
export const scaffoldQuery = groq`
  _type == "scaffold" => {
    name,
    proposedSectionShape,
    richText[]{
      ${richTextContentQuery}
    }
  }
`;
