import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { decide, isDocsOnly, parseChangedFiles } from "./gate-scope.mjs";

test("documentation-only changes skip the code gate", () => {
  assert.equal(
    isDocsOnly([
      "docs/agents/build-flow.md",
      "docs/plans/2026-09-18-next-work-plan.md",
      "README.md",
      "CLAUDE.md",
      ".claude/skills/page-draft/SKILL.md",
      ".codex/notes.md",
    ]),
    true,
  );
});

test("any code, config, lockfile, or workflow change runs the code gate", () => {
  for (const file of [
    "frontend/app/page.tsx",
    "studio/schema.json",
    "package.json",
    "pnpm-lock.yaml",
    ".github/workflows/release-gate.yml",
    ".github/dependabot.yml",
    "scripts/gate-scope.mjs",
    "docs/example.ts",
    ".claude/hooks/copy-local-env.sh",
    "docs/../frontend/lib/x.ts",
    "frontend/README.md.bak",
  ]) {
    assert.equal(isDocsOnly(["README.md", file]), false, file);
  }
});

test("an empty or blank file list runs the code gate", () => {
  assert.equal(isDocsOnly([]), false);
  assert.equal(isDocsOnly(["", "  ", "\n"]), false);
  assert.equal(decide([]).code, true);
});

test("the workflow's tab-separated lines parse into entries with old paths", () => {
  assert.deepEqual(
    parseChangedFiles("README.md\t\ndocs/moved.md\tfrontend/lib/moved.ts\n\n  \n"),
    [
      { filename: "README.md" },
      { filename: "docs/moved.md", previousFilename: "frontend/lib/moved.ts" },
    ],
  );
});

test("a code file renamed into documentation still runs the code gate", () => {
  const moved = [{ filename: "docs/notes.md", previousFilename: "frontend/lib/notes.ts" }];
  assert.equal(decide(moved).code, true);
  const renamedDoc = [{ filename: "docs/new.md", previousFilename: "docs/old.md" }];
  assert.equal(decide(renamedDoc).code, false);
});

test("an incomplete file list runs the code gate", () => {
  const docs = [{ filename: "README.md" }, { filename: "docs/a.md" }];
  assert.equal(decide(docs, 2).code, false);
  assert.equal(decide(docs, 3).code, true);
  assert.equal(decide(docs, Number.NaN).code, true);
});


test("the CLI skips code only with a complete, counted documentation list", () => {
  for (const [expected, input, code] of [
    ["1", "README.md\t\n", false],
    ["2", "README.md\t\n", true],
    ["", "README.md\t\n", true],
    ["invalid", "README.md\t\n", true],
    ["1", "docs/moved.md\tfrontend/moved.ts\n", true],
    ["0", "", true],
  ]) {
    const result = spawnSync(process.execPath, [new URL("./gate-scope.mjs", import.meta.url).pathname], {
      input,
      encoding: "utf8",
      env: {...process.env, EXPECTED_FILES: expected, GITHUB_OUTPUT: ""},
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, new RegExp(`code=${code}\\n$`));
  }
});


test("the required check rejects failures and unexpected skips", () => {
  const workflow = readFileSync(new URL("../.github/workflows/release-gate.yml", import.meta.url), "utf8");
  const command = workflow.split("      - name: Require the selected checks to pass")[1]
    .split("        run: |\n")[1].replace(/^          /gm, "");
  for (const [scope, required, code, success] of [
    ["success", "false", "skipped", true],
    ["success", "true", "success", true],
    ["success", "true", "skipped", false],
    ["success", "true", "failure", false],
    ["success", "true", "cancelled", false],
    ["failure", "false", "skipped", false],
    ["cancelled", "false", "skipped", false],
    ["success", "", "skipped", false],
  ]) {
    const result = spawnSync("bash", ["-e", "-c", command], {
      encoding: "utf8",
      env: {...process.env, SCOPE_RESULT: scope, CODE_REQUIRED: required, CODE_RESULT: code},
    });
    assert.equal(result.status === 0, success, `${scope}/${required}/${code}: ${result.stderr}`);
  }
});
