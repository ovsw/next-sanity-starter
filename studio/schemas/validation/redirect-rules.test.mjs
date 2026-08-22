import assert from "node:assert/strict";
import test from "node:test";

import { HARD_CODED_GONE_ROUTE_PATHS } from "../../../frontend/lib/gone-routes.ts";
import {
  CODE_OWNED_GONE_ROUTE_PATHS,
  getRedirectValidationIssues,
} from "./redirect-rules.ts";

function issues(current, redirects = [], liveRoutes = []) {
  return getRedirectValidationIssues({ current, redirects, liveRoutes });
}

test("allows many redirects to share a destination", () => {
  assert.deepEqual(
    issues(
      { source: "/new-source", destination: "/target", status: "active" },
      [{ source: "/another", destination: "/target/", status: "active" }],
      [{ path: "/target", type: "page" }],
    ),
    { errors: {} },
  );
});

test("normalizes slash variants when detecting duplicate sources", () => {
  assert.match(
    issues(
      { source: "/same/", destination: "/target", status: "active" },
      [{ source: "/same", destination: "/other", status: "active" }],
      [{ path: "/target", type: "page" }],
    ).errors.source,
    /already uses this source/,
  );
});

test("rejects redirect chains in either direction", () => {
  assert.match(
    issues(
      { source: "/b", destination: "/c", status: "active" },
      [{ source: "/a", destination: "/b", status: "active" }],
      [{ path: "/c", type: "post" }],
    ).errors.source,
    /active redirect from \/a\/ points here/,
  );
  assert.match(
    issues(
      { source: "/a", destination: "/b", status: "active" },
      [{ source: "/b", destination: "/c", status: "active" }],
    ).errors.destination,
    /create a chain/,
  );
});

test("rejects self redirects and sources that shadow routes", () => {
  assert.match(
    issues({ source: "/same", destination: "/same/" }).errors.destination,
    /cannot be the same/,
  );
  assert.match(
    issues(
      { source: "/about", destination: "/target" },
      [],
      [{ path: "about", type: "page" }],
    ).errors.source,
    /already used by a page/,
  );
});

test("rejects category sources that shadow public category routes", () => {
  assert.match(
    issues(
      {
        source: "/blog/category/loan-types/",
        destination: "/target/",
      },
      [],
      [{ path: "/blog/category/loan-types/", type: "category" }],
    ).errors.source,
    /already used by a category/,
  );
});

test("recognizes public category routes as existing destinations", () => {
  assert.deepEqual(
    issues(
      {
        source: "/legacy-category/",
        destination: "/blog/category/loan-types/",
        status: "active",
      },
      [],
      [{ path: "/blog/category/loan-types/", type: "category" }],
    ),
    { errors: {} },
  );
});

test("blocks a destination that has no published route", () => {
  assert.deepEqual(
    issues({ source: "/old", destination: "/missing", status: "active" }),
    {
      errors: {
        destination:
          "Can't redirect to a non-existent or non-published page. " +
          "No published page with this slug exists. Please create one.",
      },
    },
  );
});

test("inactive redirects do not participate in active topology", () => {
  assert.equal(
    issues(
      { source: "/a", destination: "/target", status: "active" },
      [{ source: "/a/", destination: "/other", status: "inactive" }],
      [{ path: "/target", type: "page" }],
    ).errors.source,
    undefined,
  );
});

test("rejects backslashes in source and destination paths", () => {
  assert.match(
    issues({ source: "/bad\\source", destination: "/target" }).errors.source,
    /internal path/,
  );
  assert.match(
    issues({ source: "/source", destination: "/bad\\target" }).errors
      .destination,
    /internal path/,
  );
});

test("reserves every code-owned Gone source and keeps policies in sync", () => {
  assert.deepEqual(CODE_OWNED_GONE_ROUTE_PATHS, HARD_CODED_GONE_ROUTE_PATHS);

  for (const source of CODE_OWNED_GONE_ROUTE_PATHS) {
    assert.match(
      issues({ source, destination: "/target" }).errors.source,
      /reserved/,
    );
  }
});
