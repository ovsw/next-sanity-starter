import { groq } from "next-sanity";
import { imageQuery } from "./shared/image";

// @sanity-typegen-ignore
export const bigVideoFeatureQuery = groq`
  _type == "bigVideoFeature" => {
    eyebrow,
    title,
    description,
    youtubeUrl,
    thumbnailImage {
      ${imageQuery}
    }
  }
`;
