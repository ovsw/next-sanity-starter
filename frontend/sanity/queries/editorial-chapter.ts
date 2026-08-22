import { groq } from "next-sanity";
import { bodyQuery } from "./shared/body";

// @sanity-typegen-ignore
export const editorialChapterQuery = groq`
  _type == "editorialChapter" => {
    useCreamBackground,
    eyebrow,
    title,
    richText[]{
      ${bodyQuery}
    },
    supportingContent[]{
      _key,
      _type,
      _type == "quoteCallout" => {
        quote,
        context
      },
      _type == "proofPoints" => {
        items[]{
          _key,
          _type,
          title,
          description
        }
      },
      _type == "impactStatement" => {
        statement,
        label,
        description
      }
    }
  }
`;
