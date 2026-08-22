import {
  defineLocations,
  defineDocuments,
  PresentationPluginOptions,
} from "sanity/presentation";
import { ROOT_SLUG_FILTER } from "../../shared/root-slug-filter";
import { resolveCategoryPath, resolveContentPath } from "./routes";

export { resolveContentPath } from "./routes";

export const resolve: PresentationPluginOptions["resolve"] = {
  locations: {
    page: defineLocations({
      select: {
        title: "title",
        slug: "slug.current",
      },
      resolve: (doc) => ({
        locations: [
          {
            title: doc?.title || "Untitled",
            href: resolveContentPath(doc?.slug),
          },
        ],
      }),
    }),
    post: defineLocations({
      select: {
        title: "title",
        slug: "slug.current",
      },
      resolve: (doc) => ({
        locations: [
          {
            title: doc?.title || "Untitled",
            href: resolveContentPath(doc?.slug),
          },
          { title: "Blog", href: "/blog/" },
        ],
      }),
    }),
    category: defineLocations({
      select: {
        title: "title",
        slug: "slug.current",
      },
      resolve: (doc) => {
        const href = resolveCategoryPath(doc?.slug);
        return {
          locations: href
            ? [{ title: doc?.title || "Untitled Category", href }]
            : [],
        };
      },
    }),
    blogIndex: defineLocations({
      select: { title: "title" },
      resolve: (doc) => ({
        locations: [{ title: doc?.title || "Blog Index", href: "/blog/" }],
      }),
    }),
    homePage: defineLocations({
      select: { title: "title" },
      resolve: (doc) => ({
        locations: [{ title: doc?.title || "Home Page", href: "/" }],
      }),
    }),
  },
  mainDocuments: defineDocuments([
    {
      route: "/blog/",
      filter: `_id == "blogIndex"`,
    },
    {
      route: "/",
      filter: `_id == 'homePage' && _type == 'homePage'`,
    },
    {
      route: "/blog/category/:slug/",
      filter: `_type == 'category' && slug.current in [$slug, "/" + $slug]`,
    },
    {
      route: "/:slug/",
      filter: `_type in ['page', 'post'] && ${ROOT_SLUG_FILTER}`,
    },
  ]),
};
