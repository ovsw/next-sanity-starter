<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `frontend/node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Dev Server rules
Before starting a development server, inspect the required port. If the exact server you need is already running there, reuse it.

## Shell discipline and reporting observations

The Bash tool's working directory **persists between calls**. A `cd` in one
command silently changes what every later relative path resolves to. This has
already produced confidently-wrong claims about missing files.

- Run every command from a known cwd: use absolute paths, or `cd` to the repo
  root first. Never rely on inherited shell state.
- Do not use `2>/dev/null` on any command whose output feeds a conclusion. A
  suppressed error and an empty result look identical and mean different things.
- Do not chain independent checks with `&&` — the first failure hides every
  check after it. Use `;` or separate calls.
- **Never report a file as missing, deleted, or changed on the strength of one
  failed check.** Re-verify from an absolute path first.
- Report what was observed, not what was inferred: "the check returned nothing"
  is a different claim from "the file does not exist." Never attribute a change
  to the user's actions without direct evidence.
- When a new result contradicts an earlier observation in the same session,
  stop and re-verify. The newer result is not automatically the correct one.

This matters most before destructive or delegated work: unverified claims about
environment state (which dataset is configured, which env file is loaded) are
exactly what makes handing off write access dangerous.

## Testing
- Prefer focused functional/accessibility checks and one-time visual inspection;
- DO NOT create or maintain screenshot baselines unless explicitly requested.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): summary`.

- Common types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`, `build`, `ci`.
- Scope is optional but preferred when the change is confined to one area — e.g. `feat(header):`, `fix(studio):`.
- Summary is imperative and lowercase: "add", not "added" or "Adds".
- Keep explaining *why* in the body. The prefix classifies the change; it does not replace the reasoning.
- Note that commits predating this rule use plain imperative subjects with no prefix. Follow the convention above, not the older style.

### Issue tracker

Issues and PRDs are tracked in this repository's GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the canonical labels `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This repository uses a single-context domain-doc layout. See `docs/agents/domain.md`.

### Page Builder work

Before adding or changing a Page Builder section, read `docs/agents/page-builder.md`.

### Development workflow

Before changing workspace dependencies, Sanity schemas, GROQ queries, or development scripts, consult the relevant section of `README.md`.

## Brand names (do not flag as errors)

- **Luminate Bank** is the current lender brand.
- **The Highly Motivated Vercellino Team** (capitalization intended) is the mortgage originator.
- Both are correct, current branding in site copy. Do not report them as outdated or wrong-company references.
