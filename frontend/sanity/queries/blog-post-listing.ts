export const publishedPostFilter =
  `_type == "post" && defined(slug.current) && defined(publishedAt)`;

export const blogPostOrder = `publishedAt desc, _createdAt desc, _id asc`;
