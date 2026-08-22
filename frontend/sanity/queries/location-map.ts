import { groq } from "next-sanity";
import { imageQuery } from "./shared/image";

// @sanity-typegen-ignore
export const locationMapQuery = groq`
  _type == "locationMap" => {
    useCreamBackground,
    eyebrow,
    title,
    businessName,
    credentialLine,
    address {
      street,
      city,
      region,
      postalCode,
      country
    },
    directionsLabel,
    directionsUrl,
    mapEmbedUrl,
    mapTitle,
    image {
      ${imageQuery}
    },
    imageEyebrow,
    imageTitle
  }
`;
