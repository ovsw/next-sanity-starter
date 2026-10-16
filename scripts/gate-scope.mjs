#!/usr/bin/env node

// Decides whether a pull request needs the code half of the release gate.
//
// The GitHub workflow pipes the pull request's changed files into this script,
// one per line as a JSON array `["filename", "previous_filename"]` (the second
// item is empty unless the file was renamed). JSON keeps a filename that holds
// a tab or a newline in one record. When every path, including the old path of a
// renamed file, is documentation, the heavy jobs (typegen, types, lint, tests,
// builds, smoke) are skipped and the "Release gate" check passes on its own.
// Anything else runs the full gate, and so does an empty or incomplete list.

import { appendFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Restrict this to Markdown, including agent instructions. Documentation
// folders can also contain executable examples or hooks that need checks.
const DOCUMENTATION_PATTERNS = [/\.md$/];

export function isDocsOnly(files) {
  const names = files.map((file) => file.trim()).filter(Boolean);
  if (names.length === 0) return false;
  return names.every(
    (name) =>
      !name.split("/").includes("..") &&
      DOCUMENTATION_PATTERNS.some((pattern) => pattern.test(name)),
  );
}

export function parseChangedFiles(input) {
  const entries = [];
  for (const line of input.split("\n")) {
    if (!line.trim()) continue;
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      record = undefined;
    }
    const [filename, previousFilename = ""] = Array.isArray(record) ? record : [];
    if (
      !Array.isArray(record) ||
      record.length > 2 ||
      typeof filename !== "string" ||
      !filename.trim() ||
      typeof previousFilename !== "string"
    ) {
      throw new Error(`Malformed changed-file record: ${line}`);
    }
    entries.push(
      previousFilename.trim()
        ? { filename: filename.trim(), previousFilename: previousFilename.trim() }
        : { filename: filename.trim() },
    );
  }
  return entries;
}

// `expectedCount` is the pull request's own changed-file count. The files
// endpoint stops at 3,000 entries, so a shorter list means files are missing.
export function decide(entries, expectedCount = entries.length) {
  if (entries.length === 0) {
    return { code: true, message: "No changed files were listed; running the code gate." };
  }
  if (!Number.isInteger(expectedCount) || expectedCount !== entries.length) {
    return {
      code: true,
      message: `The file list has ${entries.length} entries but the pull request reports ${expectedCount}; running the code gate.`,
    };
  }
  const paths = entries.flatMap((entry) =>
    entry.previousFilename ? [entry.filename, entry.previousFilename] : [entry.filename],
  );
  if (isDocsOnly(paths)) {
    return {
      code: false,
      message: `${entries.length} changed file(s) are documentation only; skipping the code gate.`,
    };
  }
  return {
    code: true,
    message: `${entries.length} changed file(s) include code; running the code gate.`,
  };
}

async function readStandardInput() {
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  return input;
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  const expected = process.env.EXPECTED_FILES?.trim();
  let result;
  try {
    result = decide(
      parseChangedFiles(await readStandardInput()),
      expected === undefined || expected === "" ? Number.NaN : Number(expected),
    );
  } catch (error) {
    result = { code: true, message: `${error.message}; running the code gate.` };
  }
  const { code, message } = result;
  console.log(message);

  const output = `code=${code}\n`;
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, output);
  } else {
    process.stdout.write(output);
  }
}
