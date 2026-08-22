import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const pageHeaderQuery = groq`
  _type == "pageHeader" => {
    eyebrow,
    title,
    description,
    statistics[]{
      _key,
      _type,
      value,
      description
    }
  }
`;
