import { groq } from "next-sanity";

export const customLinkInternalHref = groq`select(
  customLink.internal->_id == "homePage" || customLink.internal->_type == "homePage" => "/",
  customLink.internal->_type == "post" && defined(customLink.internal->slug.current) => "/blog/" + array::join(string::split(customLink.internal->slug.current, "/")[@ != ""], "/"),
  customLink.internal->_type == "category" && defined(customLink.internal->slug.current) => "/blog/category/" + array::join(string::split(customLink.internal->slug.current, "/")[@ != ""], "/"),
  defined(customLink.internal->slug.current) => "/" + array::join(string::split(customLink.internal->slug.current, "/")[@ != ""], "/")
)`;

export const urlInternalHref = groq`select(
  url.internal->_id == "homePage" || url.internal->_type == "homePage" => "/",
  url.internal->_type == "post" && defined(url.internal->slug.current) => "/blog/" + array::join(string::split(url.internal->slug.current, "/")[@ != ""], "/"),
  url.internal->_type == "category" && defined(url.internal->slug.current) => "/blog/category/" + array::join(string::split(url.internal->slug.current, "/")[@ != ""], "/"),
  defined(url.internal->slug.current) => "/" + array::join(string::split(url.internal->slug.current, "/")[@ != ""], "/")
)`;

export const internalReferenceHref = groq`select(
  internal->_id == "homePage" || internal->_type == "homePage" => "/",
  internal->_type == "post" && defined(internal->slug.current) => "/blog/" + array::join(string::split(internal->slug.current, "/")[@ != ""], "/"),
  internal->_type == "category" && defined(internal->slug.current) => "/blog/category/" + array::join(string::split(internal->slug.current, "/")[@ != ""], "/"),
  defined(internal->slug.current) => "/" + array::join(string::split(internal->slug.current, "/")[@ != ""], "/")
)`;

export const legacyInternalLinkHref = groq`select(
  @.internalLink->_id == "homePage" || @.internalLink->_type == "homePage" => "/",
  @.internalLink->_type == "post" && defined(@.internalLink->slug.current) => "/blog/" + array::join(string::split(@.internalLink->slug.current, "/")[@ != ""], "/"),
  @.internalLink->_type == "category" && defined(@.internalLink->slug.current) => "/blog/category/" + array::join(string::split(@.internalLink->slug.current, "/")[@ != ""], "/"),
  defined(@.internalLink->slug.current) => "/" + array::join(string::split(@.internalLink->slug.current, "/")[@ != ""], "/")
)`;
