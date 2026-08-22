import assert from "node:assert/strict";
import test from "node:test";
import {
  getDocumentSlug,
  getPresentationPath,
  isPresentationDocumentType,
  resolveCategoryPath,
  resolveContentPath,
} from "./routes.ts";

test("does not treat an ordinary index slug as homepage identity", () => {
  assert.equal(resolveContentPath("index"), "/index/");
});

test("normalizes leading and trailing slashes", () => {
  assert.equal(resolveContentPath("///mortgage-process///"), "/mortgage-process/");
});

test("resolves a normal page slug to a canonical path", () => {
  assert.equal(getPresentationPath("page", "about"), "/about/");
});

test("resolves a normal post slug to a canonical path", () => {
  assert.equal(getPresentationPath("post", "mortgage-process"), "/mortgage-process/");
});

test("resolves a category slug under the blog category namespace", () => {
  assert.equal(
    getPresentationPath("category", "loan-types"),
    "/blog/category/loan-types/",
  );
  assert.equal(resolveCategoryPath("/loan-types/"), "/blog/category/loan-types/");
});

test("resolves the Blog Index singleton without an authored slug", () => {
  assert.equal(getPresentationPath("blogIndex"), "/blog/");
});

test("missing and empty slugs disable Presentation navigation", () => {
  assert.equal(getPresentationPath("page", undefined), null);
  assert.equal(getPresentationPath("page", ""), null);
});

test("an existing draft is authoritative when resolving its slug", () => {
  assert.equal(
    getDocumentSlug({ slug: {} }, { slug: { current: "published-path" } }),
    undefined,
  );
  assert.equal(
    getDocumentSlug(undefined, { slug: { current: "published-path" } }),
    "published-path",
  );
});

test("unsupported document types do not expose the action", () => {
  assert.equal(isPresentationDocumentType("page"), true);
  assert.equal(isPresentationDocumentType("post"), true);
  assert.equal(isPresentationDocumentType("category"), true);
  assert.equal(isPresentationDocumentType("blogIndex"), true);
  assert.equal(isPresentationDocumentType("author"), false);
});
