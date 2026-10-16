import assert from "node:assert/strict";
import test from "node:test";
import { setupRedirects } from "./setup-redirects.mjs";

const env = {
  VERCEL_TOKEN: "private-vercel-token",
  VERCEL_PROJECT_ID: "site",
  VERCEL_TEAM_ID: "team",
  SANITY_AUTH_TOKEN: "private-sanity-token",
  SANITY_STUDIO_PROJECT_ID: "project",
  SANITY_STUDIO_DATASET: "production",
};
function service({
  branch = "main",
  hookBranch = "main",
  existing = false,
  conflict = false,
} = {}) {
  const hook = {
    name: "sanity-redirects",
    ref: hookBranch,
    url: "https://api.vercel.com/private-hook",
  };
  const site = {
    link: { productionBranch: branch, deployHooks: existing ? [hook] : [] },
  };
  const hooks = [];
  const writes = [];
  const fetcher = async (url, options) => {
    assert.ok(url.includes("api.sanity.io") || url.endsWith("?teamId=team"));
    if (options.method === "POST") {
      const body = JSON.parse(options.body);
      writes.push({ url, body });
      if (url.includes("api.vercel.com")) site.link.deployHooks.push(hook);
      else hooks.push({ ...body, includeDrafts: conflict });
    }
    return {
      ok: true,
      json: async () => (url.includes("api.vercel.com") ? site : hooks),
    };
  };
  return { fetcher, writes, hooks };
}

test("creates main hook and published-only create/update/delete webhook; repeat runs do not write", async () => {
  const api = service();
  await setupRedirects(env, api.fetcher);
  assert.equal(api.writes.length, 2);
  assert.match(api.writes[0].url, /\/v2\/projects\/site\/deploy-hooks/);
  assert.deepEqual(api.writes[0].body, {
    name: "sanity-redirects",
    ref: "main",
  });
  const body = api.writes[1].body;
  assert.equal(body.dataset, "production");
  assert.equal(body.includeDrafts, false);
  assert.equal(body.includeAllVersions, false);
  assert.equal(body.httpMethod, "POST");
  assert.deepEqual(body.rule, {
    on: ["create", "update", "delete"],
    filter: '_type == "redirect"',
    projection: "{_id}",
  });
  await setupRedirects(env, api.fetcher);
  assert.equal(api.writes.length, 2);
  api.hooks[0].includeDrafts = true;
  await assert.rejects(setupRedirects(env, api.fetcher), /conflicting/);
  assert.equal(api.writes.length, 2);
});

test("refuses non-production and conflicting hooks without writes", async () => {
  for (const config of [
    { branch: "staging" },
    { existing: true, hookBranch: "staging" },
  ]) {
    const api = service(config);
    await assert.rejects(setupRedirects(env, api.fetcher), /main|conflicting/);
    assert.equal(api.writes.length, 0);
  }
});

test("validates credentials before requests and does not expose service error bodies", async () => {
  await assert.rejects(
    setupRedirects({}, () => assert.fail("Unexpected request")),
    /Missing VERCEL_TOKEN/,
  );
  await assert.rejects(
    setupRedirects(env, async () => ({
      ok: false,
      status: 403,
      json: () => assert.fail("Secret body must not be read"),
    })),
    /HTTP 403/,
  );
  await assert.rejects(
    setupRedirects(env, async () => {
      throw new Error("secret token");
    }),
    (error) => !error.message.includes("secret token"),
  );
});

test("checks saved settings after creation", async () => {
  const api = service({ conflict: true });
  await assert.rejects(setupRedirects(env, api.fetcher), /verification failed/);
});
