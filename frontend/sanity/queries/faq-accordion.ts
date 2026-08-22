import { groq } from "next-sanity";
import { simpleRichTextQuery } from "./shared/simple-rich-text";
import { urlInternalHref } from "./shared/internal-href";

// @sanity-typegen-ignore
export const faqAccordionQuery = groq`
  _type == "faqAccordion" => {
    useCreamBackground,
    eyebrow,
    title,
    subtitle,
    "faqs": array::compact(faqs[]{
      _key,
      "_id": @->._id,
      "_type": @->._type,
      "title": @->.title,
      "answer": coalesce(@->.body, @->.richText)[]{
        ${simpleRichTextQuery}
      }
    }),
    link{
      title,
      description,
      "openInNewTab": url.openInNewTab,
      "href": select(
        url.type == "internal" => ${urlInternalHref},
        url.type == "external" => url.external,
        url.href
      )
    }
  }
`;
