import { groq } from "next-sanity";
import { imageQuery } from "./shared/image";
import { urlInternalHref } from "./shared/internal-href";

// @sanity-typegen-ignore
export const stackedTimelineQuery = groq`
  _type == "stackedTimeline" => {
    title,
    intro,
    "buttons": array::compact(buttons[]{
      _key,
      _type,
      text,
      variant,
      "openInNewTab": url.openInNewTab,
      "href": select(
        url.type == "internal" => ${urlInternalHref},
        url.type == "external" => url.external,
        url.href
      )
    }),
    "items": array::compact(items[]{
      _key,
      title,
      meta,
      text,
      image {
        ${imageQuery}
      }
    })
  }
`;
