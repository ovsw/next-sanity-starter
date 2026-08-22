import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const phxEmbedSocialReviewsQuery = groq`
  _type == "phxEmbedSocialReviews" => {
    iframeTitle,
    iframeSrc,
    resizerScriptSrc
  }
`;
