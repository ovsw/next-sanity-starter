import { groq } from "next-sanity";
import { imageQuery } from "./shared/image";
import { urlInternalHref } from "./shared/internal-href";

// @sanity-typegen-ignore
export const latestArticlesQuery = groq`
  _type == "latestArticles" => {
    useCreamBackground,
    eyebrow,
    title,
    description,
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
    fallbackImage {
      ${imageQuery}
    },
    "articles": *[
      _type == "post" &&
      defined(slug.current) &&
      meta.noindex != true &&
      seoHideFromLists != true &&
      seoNoIndex != true
    ] | order(
      coalesce(publishedAt, _createdAt) desc,
      _updatedAt desc
    )[0...6]{
      _type,
      _id,
      title,
      "description": coalesce(meta.description, pt::text(excerpt)),
      "slug": slug.current,
      "publishedAt": coalesce(publishedAt, _createdAt),
      image{
        ${imageQuery}
      },
      category->{
        _id,
        title,
        slug
      }
    }
  }
`;
