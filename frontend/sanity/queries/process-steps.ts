import { groq } from "next-sanity";
import { simpleRichTextQuery } from "./shared/simple-rich-text";

// @sanity-typegen-ignore
export const processStepsQuery = groq`
  _type == "processSteps" => {
    useCreamBackground,
    eyebrow,
    title,
    intro,
    "steps": array::compact(steps[]{
      _key,
      _type,
      title,
      summary,
      body[]{
        ${simpleRichTextQuery}
      }
    })
  }
`;
