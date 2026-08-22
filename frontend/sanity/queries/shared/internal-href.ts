import { groq } from "next-sanity";

export const customLinkInternalHref = groq`select(
  customLink.internal->_id == "homePage" || customLink.internal->_type == "homePage" => "/",
  customLink.internal->_type == "category" && defined(customLink.internal->slug.current) => "/blog/category/" + customLink.internal->slug.current + "/",
  string::startsWith(customLink.internal->slug.current, "/") => customLink.internal->slug.current + "/",
  defined(customLink.internal->slug.current) => "/" + customLink.internal->slug.current + "/"
)`;

export const urlInternalHref = groq`select(
  url.internal->_id == "homePage" || url.internal->_type == "homePage" => "/",
  url.internal->_type == "category" && defined(url.internal->slug.current) => "/blog/category/" + url.internal->slug.current + "/",
  string::startsWith(url.internal->slug.current, "/") => url.internal->slug.current + "/",
  defined(url.internal->slug.current) => "/" + url.internal->slug.current + "/"
)`;

export const internalReferenceHref = groq`select(
  internal->_id == "homePage" || internal->_type == "homePage" => "/",
  internal->_type == "category" && defined(internal->slug.current) => "/blog/category/" + internal->slug.current + "/",
  string::startsWith(internal->slug.current, "/") => internal->slug.current + "/",
  defined(internal->slug.current) => "/" + internal->slug.current + "/"
)`;

export const legacyInternalLinkHref = groq`select(
  @.internalLink->_id == "homePage" || @.internalLink->_type == "homePage" => "/",
  @.internalLink->_type == "category" && defined(@.internalLink->slug.current) => "/blog/category/" + @.internalLink->slug.current + "/",
  string::startsWith(@.internalLink->slug.current, "/") => @.internalLink->slug.current + "/",
  defined(@.internalLink->slug.current) => "/" + @.internalLink->slug.current + "/"
)`;
