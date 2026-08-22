import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./shared/internal-href.ts", import.meta.url), "utf8");
const footerSource = readFileSync(new URL("./footer.ts", import.meta.url), "utf8");

test("internal href resolvers use canonical post and category namespaces", () => {
  for (const resolver of [
    "customLink.internal",
    "url.internal",
    "internal->_type",
    "@.internalLink",
  ]) {
    assert.match(source, new RegExp(`${resolver.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*category`));
  }
  assert.equal((source.match(/_type == "post"/g) || []).length, 4);
  assert.equal((source.match(/"\/blog\/" \+/g) || []).length, 4);
  assert.equal((source.match(/\/blog\/category\//g) || []).length, 4);
  assert.doesNotMatch(source, /slug\.current \+ "\/"/);
  assert.match(footerSource, /internal->_type == "post"/);
  assert.match(footerSource, /internal->_type == "category"/);
  assert.match(footerSource, /"\/blog\/category\/" \+ array::join/);
  assert.match(footerSource, /string::split\(internal->slug\.current, "\/"\)/);
  assert.doesNotMatch(footerSource, /slug\.current \+ "\/"/);
});
