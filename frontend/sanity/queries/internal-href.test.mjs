import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./shared/internal-href.ts", import.meta.url), "utf8");
const footerSource = readFileSync(new URL("./footer.ts", import.meta.url), "utf8");

test("internal href resolvers place category references under the category archive", () => {
  for (const resolver of [
    "customLink.internal",
    "url.internal",
    "internal->_type",
    "@.internalLink",
  ]) {
    assert.match(source, new RegExp(`${resolver.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*category`));
  }
  assert.equal((source.match(/\/blog\/category\//g) || []).length, 4);
  assert.match(footerSource, /internal->_type == "category"/);
  assert.match(footerSource, /"\/blog\/category\/" \+ internal->slug\.current \+ "\/"/);
});
