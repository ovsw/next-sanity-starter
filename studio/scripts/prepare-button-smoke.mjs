// Run from Studio with an empty, backed-up test dataset.
import assert from "node:assert/strict";
import { getCliClient } from "sanity/cli";
import { seed } from "./seed.mjs";
import { migrate } from "./migrate-button-lists.mjs";

const dataset = process.env.SANITY_STUDIO_DATASET;
assert.match(dataset ?? "", /^issue-63-smoke(?:-[a-z0-9-]+)?$/, "Use a dedicated issue-63-smoke dataset");
const client = getCliClient({ apiVersion: "2026-03-23" }).withConfig({ dataset, useCdn: false });
console.log(`Target: ${client.config().projectId}/${dataset}; Studio .env.local with shell overrides`);
await seed(client);
const page = await client.getDocument("starter-page-about");
const paragraph = page.blocks[0].richText[0];
paragraph.markDefs = [{
  _key: "legacy-button", _type: "buttonLink", variant: "outline",
  customLink: { _type: "customUrl", type: "external", external: "https://example.com/" },
}];
paragraph.children.push({ _key: "legacy-button-text", _type: "span", text: "Migration example link", marks: ["legacy-button"] });
const { _rev, _createdAt, _updatedAt, ...fixture } = page;
await client.transaction()
  .createOrReplace(fixture)
  .createOrReplace({ ...fixture, _id: `drafts.${fixture._id}` })
  .commit({ visibility: "sync" });
const before = await client.fetch('*[_type == "page"]', {}, { perspective: "raw" });
assert.equal((await migrate(client)).length, 2);
assert.deepEqual(await client.fetch('*[_type == "page"]', {}, { perspective: "raw" }), before);
assert.equal((await migrate(client, { apply: true })).length, 2);
assert.deepEqual(await migrate(client), []);
const after = await client.fetch('*[_type == "page"]', {}, { perspective: "raw" });
assert.deepEqual(after.map(({ _id }) => _id).sort(), before.map(({ _id }) => _id).sort());
for (const document of after) {
  assert.equal(document.blocks[0].richText[0].markDefs[0].customLink.external, "https://example.com/");
}
console.log("Migrated seed is ready. Draft and published IDs and link destinations are preserved.");
