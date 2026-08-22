import assert from "node:assert/strict";
import test from "node:test";

import { uniqueRootSlug } from "./unique-root-slug.ts";

test("allows index when no page or post already owns the route", async () => {
  const result = await uniqueRootSlug(
    { current: "/index/" },
    {
      document: { _id: "drafts.page-id" },
      getClient: () => ({ fetch: async () => null }),
    },
  );

  assert.equal(result, true);
});
