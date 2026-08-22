import { groq } from "next-sanity";

/** Resolve a redirect's selected document to its public route. */
export const redirectDestinationPath = groq`select(
  destinationReference->_id == "homePage" || destinationReference->_type == "homePage" => "/",
  destinationReference->_id == "blogIndex" || destinationReference->_type == "blogIndex" => "/blog/",
  destinationReference->_type == "category" && defined(destinationReference->slug.current) => "/blog/category/" + destinationReference->slug.current + "/",
  destinationReference->_type in ["page", "post"] && string::startsWith(destinationReference->slug.current, "/") => destinationReference->slug.current + "/",
  destinationReference->_type in ["page", "post"] && defined(destinationReference->slug.current) => "/" + destinationReference->slug.current + "/"
)`;
