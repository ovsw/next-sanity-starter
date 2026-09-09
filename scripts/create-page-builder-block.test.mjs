import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "../frontend/node_modules/typescript/lib/typescript.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const registrations = [
  "studio/schemas/blocks/page-builder.ts",
  "studio/schema-types.ts",
  "frontend/sanity/queries/page-builder.ts",
  "frontend/components/blocks/index.tsx",
];
const script = "scripts/create-page-builder-block.mjs";
const exec = promisify(execFile);
const requireFrontend = createRequire(join(root, "frontend/package.json"));

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), "starter-generator-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  for (const file of [script, ...registrations]) {
    await mkdir(dirname(join(dir, file)), { recursive: true });
    await copyFile(join(root, file), join(dir, file));
  }
  return {
    dir,
    run: (...args) =>
      exec(process.execPath, [join(dir, script), ...args], { cwd: dir }),
    module: () => import(pathToFileURL(join(dir, script)).href),
  };
}

async function snapshot(dir, prefix = "") {
  const result = {};
  for (const entry of await readdir(join(dir, prefix), {
    withFileTypes: true,
  })) {
    const name = join(prefix, entry.name);
    if (entry.isDirectory()) Object.assign(result, await snapshot(dir, name));
    else result[name] = (await readFile(join(dir, name))).toString("base64");
  }
  return result;
}

test("dry run makes no writes", async (t) => {
  const f = await fixture(t);
  const before = await snapshot(f.dir);
  assert.match(
    (await f.run("sampleFeature", "--dry-run")).stdout,
    /Would create/,
  );
  assert.deepEqual(await snapshot(f.dir), before);
  assert.equal(
    (await readdir(f.dir)).includes(".page-builder-generator.lock"),
    false,
  );
});

for (const scope of ["content", "general", "home"])
  test(`generation registers ${scope} scope, query, schema, renderer and editing`, async (t) => {
    const f = await fixture(t);
    const title = 'A "title" = `value`\n${unsafe} \\ end';
    await writeFile(
      join(f.dir, "preview.jpg"),
      Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
    );
    await f.run(
      "sample-feature",
      "--scope",
      scope,
      `--title=${title}`,
      "--preview",
      "preview.jpg",
    );
    const sources = await Promise.all(
      registrations.map((file) => readFile(join(f.dir, file), "utf8")),
    );
    assert.ok(
      sources[0].includes(
        `  "sampleFeature",\n  // page-builder-generator:${scope}-types`,
      ),
    );
    assert.ok(
      sources[0].includes(
        '"sampleFeature",\n  // page-builder-generator:preview-types',
      ),
    );
    assert.match(
      sources[1],
      /import sampleFeature from "\.\/schemas\/blocks\/sample-feature"/,
    );
    assert.match(sources[1], /  sampleFeature,/);
    assert.ok(sources[2].includes("${sampleFeatureQuery},"));
    assert.match(sources[3], /sampleFeature: SampleFeature/);
    assert.ok(
      sources[3].includes(
        '"sampleFeature",\n  // page-builder-generator:editing-types',
      ),
    );
    const schema = await readFile(
      join(f.dir, "studio/schemas/blocks/sample-feature.ts"),
      "utf8",
    );
    assert.ok(schema.includes(`title: ${JSON.stringify(title)}`));
    for (const file of [
      "studio/schemas/blocks/sample-feature.ts",
      "frontend/sanity/queries/sample-feature.ts",
      "frontend/components/blocks/sample-feature.tsx",
    ]) {
      const source = await readFile(join(f.dir, file), "utf8");
      const parsed = ts.createSourceFile(
        file,
        source,
        ts.ScriptTarget.Latest,
        true,
      );
      assert.deepEqual(parsed.parseDiagnostics, [], file);
    }
    const component = await readFile(
      join(f.dir, "frontend/components/blocks/sample-feature.tsx"),
      "utf8",
    );
    assert.match(component, /aria-labelledby=\{headingId\}/);
    assert.ok(component.includes('dataAttribute?.("title")'));
    assert.ok(component.includes('dataAttribute?.("description")'));
    const compiled = ts.transpileModule(component, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText;
    const exports = {};
    new Function("require", "exports", compiled)(
      (name) =>
        name === "next-sanity"
          ? { stegaClean: (value) => value }
          : requireFrontend(name),
      exports,
    );
    assert.equal(exports.default({ _key: "test", title: null }), null);
    const rendered = exports.default({
      _key: "test",
      title: "Hello",
      description: "Details",
      dataAttribute: (field) => `edit:${field}`,
    });
    assert.equal(rendered.type, "section");
    assert.equal(
      rendered.props["aria-labelledby"],
      "sample-feature-test-title",
    );
    const [heading, paragraph] = rendered.props.children.props.children;
    assert.equal(heading.props.children, "Hello");
    assert.equal(heading.props["data-sanity"], "edit:title");
    assert.equal(paragraph.props.children, "Details");
    assert.deepEqual(
      await readFile(
        join(f.dir, "studio/static/images/preview/sampleFeature.jpg"),
      ),
      await readFile(join(f.dir, "preview.jpg")),
    );
    const before = await snapshot(f.dir);
    await assert.rejects(f.run("sampleFeature"), /Refusing to overwrite/);
    assert.deepEqual(await snapshot(f.dir), before);
  });

test("lock, malformed names, reserved words and missing markers refuse without partial files", async (t) => {
  const f = await fixture(t);
  const before = await snapshot(f.dir);
  for (const name of [
    "../escape",
    "9bad",
    "bad/name",
    "bad--name",
    "bad name",
    "class",
  ]) {
    await assert.rejects(f.run(name));
    assert.deepEqual(await snapshot(f.dir), before);
  }
  await mkdir(join(f.dir, ".page-builder-generator.lock"));
  await assert.rejects(f.run("sampleFeature"), /Another generator/);
  await rm(join(f.dir, ".page-builder-generator.lock"), { recursive: true });
  const map = join(f.dir, registrations[3]);
  await writeFile(
    map,
    (await readFile(map, "utf8")).replace(
      "// page-builder-generator:component-map",
      "// missing",
    ),
  );
  const broken = await snapshot(f.dir);
  await assert.rejects(f.run("sampleFeature"), /exactly one/);
  assert.deepEqual(await snapshot(f.dir), broken);
});

test("existing registration refuses even when generated files are absent", async (t) => {
  const f = await fixture(t);
  await assert.rejects(f.run("hero"), /already registered/);
});

test("write failure restores own registrations and removes own generated files", async (t) => {
  const f = await fixture(t);
  const generator = await f.module();
  const before = await snapshot(f.dir);
  const plan = await generator.buildPlan({
    name: "sampleFeature",
    scope: "content",
  });
  await assert.rejects(
    generator.applyPlan(
      plan,
      {},
      {
        copyFile,
        writeFile: async (file, ...args) => {
          if (file === join(f.dir, registrations[1]))
            throw new Error("injected failure");
          return writeFile(file, ...args);
        },
      },
    ),
    /injected failure/,
  );
  assert.deepEqual(await snapshot(f.dir), before);
});

test("concurrent registration edits are preserved and generated dependencies retained", async (t) => {
  const f = await fixture(t);
  const generator = await f.module();
  const plan = await generator.buildPlan({
    name: "sampleFeature",
    scope: "content",
  });
  const changed = `${plan.registrations.blockTypes}\n// other writer\n`;
  await assert.rejects(
    generator.applyPlan(
      plan,
      {},
      {
        copyFile,
        writeFile: async (file, ...args) => {
          if (file === join(f.dir, registrations[1])) {
            await writeFile(join(f.dir, registrations[0]), changed);
            throw new Error("injected failure");
          }
          return writeFile(file, ...args);
        },
      },
    ),
    /injected failure/,
  );
  assert.equal(await readFile(join(f.dir, registrations[0]), "utf8"), changed);
  assert.match(await readFile(plan.targets.schema, "utf8"), /sampleFeature/);
});

test("planning comparison detects changes before creating files", async (t) => {
  const f = await fixture(t);
  const generator = await f.module();
  const plan = await generator.buildPlan({
    name: "sampleFeature",
    scope: "content",
  });
  await writeFile(join(f.dir, registrations[0]), "// concurrent edit");
  const before = await snapshot(f.dir);
  await assert.rejects(generator.applyPlan(plan, {}), /changed while planning/);
  assert.deepEqual(await snapshot(f.dir), before);
});

test("exclusive preview copy preserves a file created after planning", async (t) => {
  const f = await fixture(t);
  const generator = await f.module();
  const preview = join(f.dir, "preview.jpg");
  await writeFile(preview, "source image");
  const plan = await generator.buildPlan({
    name: "sampleFeature",
    scope: "home",
    preview,
  });
  await mkdir(dirname(plan.targets.preview), { recursive: true });
  await writeFile(plan.targets.preview, "other writer image");
  const before = await snapshot(f.dir);
  await assert.rejects(generator.applyPlan(plan, { preview }), {
    code: "EEXIST",
  });
  assert.deepEqual(await snapshot(f.dir), before);
});

test("rollback does not remove a generated file another writer changed", async (t) => {
  const f = await fixture(t);
  const generator = await f.module();
  const plan = await generator.buildPlan({
    name: "sampleFeature",
    scope: "content",
  });
  await assert.rejects(
    generator.applyPlan(
      plan,
      {},
      {
        copyFile,
        writeFile: async (file, ...args) => {
          if (file === join(f.dir, registrations[0])) {
            await writeFile(plan.targets.schema, "// other writer");
            throw new Error("injected failure");
          }
          return writeFile(file, ...args);
        },
      },
    ),
    /injected failure/,
  );
  assert.equal(await readFile(plan.targets.schema, "utf8"), "// other writer");
});
