import { defineQuery } from "next-sanity";
import { ROOT_SLUG_FILTER } from "../../../shared/root-slug-filter";
import {
  archiveSharingPhotoQuery,
  pageSharingPhotoQuery,
} from "./shared/sharing-photo";

export const HOME_PAGE_OG_IMAGE_QUERY = defineQuery(`
  *[_id == "homePage" && _type == "homePage"][0]{
    "overrideTitle": meta.title,
    title,
    ${pageSharingPhotoQuery}
  }
`);

export const PAGE_OG_IMAGE_QUERY = defineQuery(`
  *[_type == "page" && ${ROOT_SLUG_FILTER}][0]{
    "title": coalesce(title, meta.title),
    ${pageSharingPhotoQuery}
  }
`);

export const BLOG_INDEX_OG_IMAGE_QUERY = defineQuery(`
  *[_id == "blogIndex" && _type == "blogIndex"][0]{
    "title": coalesce(title, meta.title),
    ${archiveSharingPhotoQuery}
  }
`);

export const CATEGORY_OG_IMAGE_QUERY = defineQuery(`
  *[_type == "category" && slug.current == $slug][0]{
    "title": coalesce(title, meta.title),
    ${archiveSharingPhotoQuery}
  }
`);
