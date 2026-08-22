import { groq } from "next-sanity";
import { bodyQuery } from "./shared/body";
import { imageQuery } from "./shared/image";
import { urlInternalHref } from "./shared/internal-href";

// @sanity-typegen-ignore
export const videoFeatureQuery = groq`
  _type == "videoFeature" => {
    useCreamBackground,
    eyebrow,
    title,
    richText[]{
      ${bodyQuery}
    },
    buttons[]{
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
    },
    youtubeUrl,
    thumbnailImage {
      ${imageQuery}
    }
  }
`;
