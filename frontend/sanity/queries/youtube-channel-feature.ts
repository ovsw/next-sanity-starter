import { groq } from "next-sanity";
import { imageQuery } from "./shared/image";

// @sanity-typegen-ignore
export const youtubeChannelFeatureQuery = groq`
  _type == "youtubeChannelFeature" => {
    eyebrow,
    title,
    richText[]{
      ...
    },
    facts[]{
      _key,
      _type,
      label,
      value
    },
    channelImage {
      ${imageQuery}
    },
    mobileChannelImage {
      ${imageQuery}
    },
    youtubeButton {
      label,
      url
    }
  }
`;
