import { groq } from "next-sanity";
import { imageQuery } from "./shared/image";
import { customLinkMarkDefsQuery } from "./shared/custom-link";
import { urlInternalHref } from "./shared/internal-href";

// @sanity-typegen-ignore
export const storyFeatureQuery = groq`
  _type == "storyFeature" => {
    useCreamBackground,
    eyebrow,
    title,
    image {
      ${imageQuery}
    },
    imageCaption,
    richText[]{
      ...,
      ${customLinkMarkDefsQuery}
    },
    keyDetails {
      title,
      items[]
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
    }
  }
`;
