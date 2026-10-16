import assert from "node:assert/strict";
import test from "node:test";

import {
  autoRedirectId,
  planAutoRedirect,
  resolveFetchedRedirectDestination,
  shouldWriteAutoRedirect,
} from "./model.ts";

test("prevents writes during local Sanity Function tests", () => {
  assert.equal(shouldWriteAutoRedirect(true), false);
  assert.equal(shouldWriteAutoRedirect(false), true);
  assert.equal(shouldWriteAutoRedirect(undefined), true);
});

test("never falls back when a destination reference cannot resolve", () => {
  assert.equal(
    resolveFetchedRedirectDestination({
      destination: "/stale-path",
      destinationReference: { _ref: "missing-page", _type: "reference" },
    }),
    undefined,
  );
  assert.equal(
    resolveFetchedRedirectDestination({ destination: "/legacy-path/" }),
    "/legacy-path/",
  );
});

test("creates a canonical permanent redirect for a page rename", () => {
  assert.deepEqual(
    planAutoRedirect({
      event: {
        beforeSlug: "/old-page/",
        documentId: "page-id",
        documentType: "page",
        slug: "/new-page/",
      },
      liveRoutes: [],
      redirects: [],
    }),
    {
      action: "apply",
      create: true,
      destination: "/new-page",
      destinationDocumentId: "page-id",
      remove: [],
      retire: [],
      retarget: [],
      source: "/old-page",
    },
  );
});

test("creates post and category redirects in their public namespaces", () => {
  const post = planAutoRedirect({
    event: {
      beforeSlug: "old-post",
      documentId: "post-id",
      documentType: "post",
      slug: "new-post",
    },
    liveRoutes: [],
    redirects: [],
  });
  const category = planAutoRedirect({
    event: {
      beforeSlug: "old-category",
      documentId: "category-id",
      documentType: "category",
      slug: "new-category",
    },
    liveRoutes: [],
    redirects: [],
  });

  assert.equal(post.action, "apply");
  assert.equal(post.source, "/blog/old-post");
  assert.equal(post.destination, "/blog/new-post");
  assert.equal(category.action, "apply");
  assert.equal(category.source, "/blog/category/old-category");
  assert.equal(category.destination, "/blog/category/new-category");
});

test("flattens incoming redirects after repeated renames", () => {
  assert.deepEqual(
    planAutoRedirect({
      event: {
        beforeSlug: "b",
        documentId: "page-id",
        documentType: "page",
        slug: "c",
      },
      liveRoutes: [],
      redirects: [
        {
          _id: "redirect-a",
          _rev: "rev-a",
          source: "/a",
          destination: "/b",
          destinationReference: { _ref: "page-id" },
          status: "active",
        },
      ],
    }),
    {
      action: "apply",
      create: true,
      destination: "/c",
      destinationDocumentId: "page-id",
      remove: [],
      retire: [],
      retarget: [{ _id: "redirect-a", _rev: "rev-a" }],
      source: "/b",
    },
  );
});

test("rejects page renames into or out of the blog namespace", () => {
  for (const [beforeSlug, slug] of [["about", "blog/post"], ["blog/post", "about"]]) {
    const plan = planAutoRedirect({
      event: { beforeSlug, slug, documentId: "page-id", documentType: "page" },
      liveRoutes: [], redirects: [],
    });
    assert.equal(plan.action, "skip");
    assert.match(plan.reason, /reserved/);
  }
});

test("retires the active redirect when a document reclaims an old slug", () => {
  assert.deepEqual(
    planAutoRedirect({
      event: {
        beforeSlug: "b",
        documentId: "page-id",
        documentType: "page",
        slug: "a",
      },
      liveRoutes: [],
      redirects: [
        {
          _id: "redirect-a",
          _rev: "rev-a",
          source: "/a",
          destination: "/a",
          destinationReference: { _ref: "page-id" },
          status: "active",
        },
      ],
    }),
    {
      action: "apply",
      create: true,
      destination: "/a",
      destinationDocumentId: "page-id",
      remove: [],
      retire: [{ _id: "redirect-a", _rev: "rev-a" }],
      retarget: [],
      source: "/b",
    },
  );
});

test("disables editor URL redirects when a page reclaims their source", () => {
  for (const destination of ["/b", "/elsewhere"]) {
    assert.deepEqual(
      planAutoRedirect({
        event: {
          beforeSlug: "b",
          documentId: "page-id",
          documentType: "page",
          slug: "a",
        },
        liveRoutes: [],
        redirects: [{
          _id: "editor-redirect",
          _rev: "editor-revision",
          source: "/a",
          destination,
          status: "active",
          permanent: "true",
        }],
      }),
      {
        action: "apply",
        create: true,
        destination: "/a",
        destinationDocumentId: "page-id",
        remove: [],
        retire: [{ _id: "editor-redirect", _rev: "editor-revision" }],
        retarget: [],
        source: "/b",
      },
    );
  }
});

test("deletes its own redirect when a document reclaims an old slug", () => {
  const ownId = autoRedirectId("/a");
  const reclaim = (redirect) =>
    planAutoRedirect({
      event: {
        beforeSlug: "b",
        documentId: "page-id",
        documentType: "page",
        slug: "a",
      },
      liveRoutes: [],
      redirects: [
        {
          _id: ownId,
          _rev: "rev-a",
          source: "/a",
          destination: "/a",
          destinationReference: { _ref: "page-id" },
          permanent: "true",
          status: "active",
          ...redirect,
        },
      ],
    });

  const plan = reclaim({});
  assert.equal(plan.action, "apply");
  assert.equal(plan.create, true);
  assert.equal(plan.source, "/b");
  assert.deepEqual(plan.remove, [{ _id: ownId, _rev: "rev-a" }]);
  assert.deepEqual(plan.retire, []);

  // An editor has a pending or published change: keep it, only switch it off.
  for (const change of [
    { hasPendingEdits: true },
    { status: undefined },
    { permanent: "false" },
    { utmSource: "flyer" },
    { utmCampaign: "spring" },
  ]) {
    const edited = reclaim(change);
    assert.deepEqual(edited.remove, [], JSON.stringify(change));
    assert.deepEqual(edited.retire, [{ _id: ownId, _rev: "rev-a" }]);
  }
});

test("renaming back and forth leaves one active redirect each time", () => {
  const page = { documentId: "page-id", documentType: "page" };
  const toB = planAutoRedirect({
    event: { ...page, beforeSlug: "a", slug: "b" },
    liveRoutes: [],
    redirects: [],
  });
  assert.equal(toB.source, "/a");

  // Back to A: the A -> B redirect now resolves to A through its reference.
  const aToB = {
    _id: autoRedirectId("/a"),
    source: "/a",
    destination: "/a",
    destinationReference: { _ref: "page-id" },
    permanent: "true",
    status: "active",
  };
  const toA = planAutoRedirect({
    event: { ...page, beforeSlug: "b", slug: "a" },
    liveRoutes: [],
    redirects: [aToB],
  });
  assert.deepEqual(toA.remove, [{ _id: aToB._id, _rev: undefined }]);
  assert.equal(toA.source, "/b");

  // To B again: A has no redirect left in the way, so it gets one.
  const bToA = {
    _id: autoRedirectId("/b"),
    source: "/b",
    destination: "/b",
    destinationReference: { _ref: "page-id" },
    permanent: "true",
    status: "active",
  };
  const toBAgain = planAutoRedirect({
    event: { ...page, beforeSlug: "a", slug: "b" },
    liveRoutes: [],
    redirects: [bToA],
  });
  assert.equal(toBAgain.action, "apply");
  assert.equal(toBAgain.create, true);
  assert.equal(toBAgain.source, "/a");
  assert.deepEqual(toBAgain.remove, [{ _id: bToA._id, _rev: undefined }]);
});

test("repairs out-of-order rename delivery without creating a chain", () => {
  const plan = planAutoRedirect({
    event: {
      beforeSlug: "a",
      documentId: "page-id",
      documentType: "page",
      slug: "b",
    },
    liveRoutes: [],
    redirects: [
      {
        _id: "redirect-b",
        source: "/b",
        destination: "/c",
        destinationReference: { _ref: "page-id" },
        status: "active",
      },
    ],
  });

  assert.equal(plan.action, "apply");
  assert.equal(plan.source, "/a");
  assert.equal(plan.destination, "/c");
});

test("does not flatten redirects that cannot prove the same destination document", () => {
  const event = {
    beforeSlug: "b",
    documentId: "page-id",
    documentType: "page",
    slug: "c",
  };

  for (const redirect of [
    { _id: "path-only", source: "/a", destination: "/b", status: "active" },
    {
      _id: "other-document",
      source: "/a",
      destination: "/b",
      destinationReference: { _ref: "other-page" },
      status: "active",
    },
  ]) {
    assert.match(
      planAutoRedirect({ event, liveRoutes: [], redirects: [redirect] }).reason,
      /cannot be verified/,
    );
  }
});

test("clears a redirect to another document when a page takes its source", () => {
  const takeB = (redirect) =>
    planAutoRedirect({
      event: {
        beforeSlug: "a",
        documentId: "page-id",
        documentType: "page",
        slug: "b",
      },
      liveRoutes: [],
      redirects: [
        {
          _rev: "rev-b",
          source: "/b",
          destination: "/c",
          destinationReference: { _ref: "other-page" },
          permanent: "true",
          status: "active",
          ...redirect,
        },
      ],
    });

  // An editor's redirect is kept, only switched off.
  const editor = takeB({ _id: "editor-redirect" });
  assert.equal(editor.action, "apply");
  assert.equal(editor.create, true);
  assert.equal(editor.source, "/a");
  assert.equal(editor.destination, "/b");
  assert.deepEqual(editor.remove, []);
  assert.deepEqual(editor.retire, [{ _id: "editor-redirect", _rev: "rev-b" }]);

  // A redirect the function made for the other document is deleted.
  const own = takeB({ _id: autoRedirectId("/b") });
  assert.equal(own.action, "apply");
  assert.deepEqual(own.remove, [{ _id: autoRedirectId("/b"), _rev: "rev-b" }]);
  assert.deepEqual(own.retire, []);

  // The same redirect with pending edits is only switched off.
  const pending = takeB({ _id: autoRedirectId("/b"), hasPendingEdits: true });
  assert.deepEqual(pending.remove, []);
  assert.deepEqual(pending.retire, [{ _id: autoRedirectId("/b"), _rev: "rev-b" }]);
});

test("is idempotent when Sanity redelivers the same publish event", () => {
  const event = {
    beforeSlug: "old",
    documentId: "page-id",
    documentType: "page",
    slug: "new",
  };
  const first = planAutoRedirect({ event, liveRoutes: [], redirects: [] });
  assert.equal(first.action, "apply");

  const id = autoRedirectId(first.source);
  const retry = planAutoRedirect({
    event,
    liveRoutes: [],
    redirects: [
      {
        _id: id,
        source: first.source,
        destination: first.destination,
        status: "active",
      },
    ],
  });

  assert.equal(retry.action, "apply");
  assert.equal(retry.create, false);
  assert.equal(autoRedirectId(first.source), id);
});

test("blocks inactive-source conflicts, live routes, and redirect cycles", () => {
  assert.match(
    planAutoRedirect({
      event: {
        beforeSlug: "old",
        documentId: "page-id",
        documentType: "page",
        slug: "new",
      },
      liveRoutes: [],
      redirects: [
        {
          source: "/old",
          destination: "/elsewhere",
          status: "inactive",
        },
      ],
    }).reason,
    /inactive redirect already uses/,
  );
  assert.match(
    planAutoRedirect({
      event: {
        beforeSlug: "old",
        documentId: "page-id",
        documentType: "page",
        slug: "new",
      },
      liveRoutes: [{ _id: "other-page", path: "/old" }],
      redirects: [],
    }).reason,
    /Route collision/,
  );
  assert.match(
    planAutoRedirect({
      event: {
        beforeSlug: "c",
        documentId: "page-id",
        documentType: "page",
        slug: "b",
      },
      liveRoutes: [],
      redirects: [
        {
          source: "/b",
          destination: "/c",
          destinationReference: { _ref: "page-id" },
          status: "active",
        },
      ],
    }).reason,
    /cycle/,
  );
});

test("rejects reserved, unsafe, unsupported, and first-publish events", () => {
  for (const event of [
    {
      beforeSlug: "blog",
      documentId: "page-id",
      documentType: "page",
      slug: "new",
    },
    {
      beforeSlug: "bad\\path",
      documentId: "page-id",
      documentType: "page",
      slug: "new",
    },
    { beforeSlug: "old", documentType: "author", slug: "new" },
    { documentId: "page-id", documentType: "page", slug: "new" },
  ]) {
    assert.equal(
      planAutoRedirect({ event, liveRoutes: [], redirects: [] }).action,
      "skip",
    );
  }
});

test("ignores draft and release renames for every routed document type", () => {
  for (const documentType of ["page", "post", "category"]) {
    for (const documentId of ["drafts.document-id", "versions.release-id.document-id"]) {
      const plan = planAutoRedirect({
        event: { documentId, documentType, beforeSlug: "old", slug: "new" },
        liveRoutes: [],
        redirects: [],
      });
      assert.equal(plan.action, "skip");
      assert.match(plan.reason, /not live/);
    }
  }
});
