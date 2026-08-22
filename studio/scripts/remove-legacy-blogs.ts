import { isDeepStrictEqual } from "node:util";
import { getCliClient } from "sanity/cli";

const API_VERSION = "2026-03-23";
const DATASET = "development";
const EXPECTED_BLOG_COUNT = 45;
const EXPECTED_POST_COUNT = 58;

type SanityDocument = {
  _id: string;
  _rev: string;
  [key: string]: unknown;
};

async function main() {
  const apply = process.argv.includes("--apply");
  const client = getCliClient({
    apiVersion: API_VERSION,
    dataset: DATASET,
    perspective: "raw",
  });

  if (client.config().dataset !== DATASET) {
    throw new Error(`Refusing to run outside the ${DATASET} dataset`);
  }

  const [blogs, posts, referrers] = await Promise.all([
    client.fetch<SanityDocument[]>(
      `*[_type == "blog"] | order(_id asc){_id, _rev}`,
    ),
    client.fetch<SanityDocument[]>(`*[_type == "post"] | order(_id asc)`),
    client.fetch<Array<{ _id: string; _type: string }>>(
      `*[_type != "blog" && references(*[_type == "blog"]._id)]{_id, _type}`,
    ),
  ]);

  if (blogs.length !== EXPECTED_BLOG_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_BLOG_COUNT} blog documents, found ${blogs.length}`,
    );
  }
  if (posts.length !== EXPECTED_POST_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_POST_COUNT} post documents, found ${posts.length}`,
    );
  }
  if (referrers.length > 0) {
    throw new Error(
      `Refusing to delete referenced blogs: ${JSON.stringify(referrers)}`,
    );
  }

  console.log(
    JSON.stringify(
      {
        dataset: DATASET,
        mode: apply ? "apply" : "dry-run",
        blogs: blogs.map(({ _id }: SanityDocument) => _id),
        blogCount: blogs.length,
        postCount: posts.length,
        referrerCount: referrers.length,
      },
      null,
      2,
    ),
  );

  if (!apply) return;

  let transaction = client.transaction();
  for (const blog of blogs) {
    transaction = transaction.delete(blog._id);
  }
  await transaction.commit({ visibility: "sync" });

  const [remainingBlogs, postsAfter] = await Promise.all([
    client.fetch<number>(`count(*[_type == "blog"])`),
    client.fetch<SanityDocument[]>(`*[_type == "post"] | order(_id asc)`),
  ]);

  if (remainingBlogs !== 0) {
    throw new Error(`Verification failed: ${remainingBlogs} blogs remain`);
  }
  if (!isDeepStrictEqual(postsAfter, posts)) {
    throw new Error("Verification failed: post documents changed");
  }

  console.log(
    JSON.stringify(
      {
        deleted: blogs.length,
        remainingBlogs,
        postCount: postsAfter.length,
        postsUnchanged: true,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
