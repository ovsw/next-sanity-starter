import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const homebotWidgetQuery = groq`
  _type == "homebotWidget" => {
    heading
  }
`;
