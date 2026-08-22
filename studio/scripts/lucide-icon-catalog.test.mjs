import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { dynamicIconImports } from "lucide-react/dynamic.mjs";
import {
  buildLucideIconCatalog,
  getCanonicalLucideIconNames,
  getLucideIconAliases,
} from "./generate-lucide-icon-catalog.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.resolve(
  scriptDirectory,
  "../schemas/inputs/lucide-icon-names.ts",
);

test("generated Lucide icon catalog matches the installed package", async () => {
  assert.equal(await readFile(catalogPath, "utf8"), await buildLucideIconCatalog());
});

test("canonical Lucide icon catalog excludes legacy aliases", async () => {
  const names = await getCanonicalLucideIconNames();
  const aliases = await getLucideIconAliases();

  assert.equal(new Set(names).size, names.length);
  assert.equal(new Set([...names, ...aliases]).size, Object.keys(dynamicIconImports).length);
  assert.ok(names.every((name) => name in dynamicIconImports));
  assert.ok(names.includes("house"));
  assert.ok(names.includes("users-round"));
  assert.ok(!names.includes("home"));
  assert.ok(!names.includes("users-2"));
  assert.ok(aliases.includes("home"));
  assert.ok(aliases.includes("users-2"));
});
