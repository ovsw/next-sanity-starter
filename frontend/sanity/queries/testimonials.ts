import { imageQuery } from "./shared/image";
import { groq } from "next-sanity";
import { simpleRichTextQuery } from "./shared/simple-rich-text";

// @sanity-typegen-ignore
export const testimonialsQuery = groq`
  _type == "testimonials" => {
    title,
    testimonials[]{
      _key,
      _type,
      "_ref": _ref,
      "document": @->{
        _id,
        _type,
        name,
        title,
        rating,
        image { ${imageQuery} },
        body[]{
          ${simpleRichTextQuery}
        }
      }
    }
  }
`;
