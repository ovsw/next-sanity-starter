Follow the ASD-STE100 Simplified Technical English (STE).
Always unslop.
When the user is confused, explain the subject as if they are 10 years old.

Use the repository Playwright CLI for automated browser tests. It launches real
Google Chrome in headless mode. Run these tests when the verification policy
requires them. Do not substitute the T3 preview, in-app browser, browser MCP,
or another browser tool. If Chrome is missing, run
`pnpm --dir frontend exec playwright install chrome`. Report the exact error if
system permissions or dependencies prevent installation.

Automated browser tests can inspect the DOM, accessibility, keyboard behavior,
and layout values. They do not give a visual verdict. Keep screenshot, video,
and trace capture off. Create a screenshot or other visual artifact only when
the user asks for it in the current task.

The user performs visual inspection. Give the exact URL, viewport, state, and
actions to inspect. State what you did not inspect. Only the user's report is a
visual verdict. Use the T3 preview or another interactive browser tool only
when the user asks for that tool in the current task.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `frontend/node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Development servers

Before starting a development server, inspect its required port. Reuse a
healthy server already running on that exact port.

## Sanity browser checks

When the user asks for a Sanity browser check, use the user-provided Chromium
browser for Studio, Presentation, local, and remote checks. Do not use the
ChatGPT in-app browser for Sanity.

For a local frontend review, preserve the draft-preview parameters, including
`sanity-preview-perspective=drafts`. Confirm known draft-only content before
reviewing the page. A Studio login, preview query parameter, or HTTP 200 does
not prove that the frontend shows drafts.

When handing off a Sanity dataset edit for inspection, give the direct local
Studio URL that opens the exact document in Presentation mode.

## Shell discipline and observations

The shell working directory can persist between calls. Run every command from
a known directory. Use absolute paths or set the repository root explicitly.

- Do not suppress errors from commands whose output supports a conclusion.
- Run independent checks separately so one failure does not hide another.
- Recheck an absolute path before reporting a file as missing, deleted, or
  changed.
- Report observations separately from inferences.
- When results conflict, recheck before choosing which result is correct.

This is required before destructive or delegated work. Confirm environment
state, including the configured dataset and loaded environment file, before
granting write access or reporting its effects.

## Fast verification

Run the smallest check that can catch a syntax, type, generated-code, or logic
failure in the changed area. Add or run focused tests when the user asks, or
when the change involves destructive data work, security or authorization,
subtle pure logic, or a regression that is expensive to reproduce.

The user performs visual checks. Give the exact URL, viewport, state, and
actions to inspect. Do not call a visual or layout change verified, working,
confirmed, or fixed on your own authority. Do not create screenshot baselines
unless the user asks.

`pnpm verify` is the release and pull-request gate. It includes functional
tests in headless Chrome. These tests keep screenshot, video, and trace capture
off.

## Reviews

Review agents and review tools are explicit opt-in. Invoke review subagents,
review skills, CodeRabbit, or an adversarial review loop only when the user asks
for that review in the current task.

Use at most one CodeRabbit review per pull request. Never request a second
review after applying the first review's fixes.

## Repository scanning

Use `rg` or `git ls-files` for discovery. Exclude `.claude/worktrees/`,
`node_modules/`, `.next/`, `.sanity/`, `dist/`, `build/`, and `backups/` from
broad scans. If `find` is necessary, prune those paths explicitly.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): summary`.

- Common types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`, `build`, `ci`.
- Scope is optional but preferred when the change is confined to one area.
- Write the summary in the imperative and lowercase: `add`, not `added` or
  `Adds`.
- Explain why in the body when the reason is not clear from the diff.

## Agent guides

## Agent skills

### Issue tracker

Issues and PRDs are tracked in this repository's GitHub Issues. See
`docs/agents/issue-tracker.md`.

### Triage labels

Use the canonical labels `needs-triage`, `needs-info`, `ready-for-agent`,
`ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This repository uses a single-context domain-doc layout. See
`docs/agents/domain.md`.

### Build flow

Before writing a feature spec, splitting work into tickets, implementing a
ticket, or using TDD, read `docs/agents/build-flow.md`.

### Page Builder work

Before adding or changing a Page Builder section, its fields, or its stored
content shape, read `docs/agents/page-builder.md`.

### Development workflow

Before changing workspace dependencies, Sanity schemas, GROQ queries, or
development scripts, consult the relevant section of `README.md`.

### Sanity CLI and dataset writes

Run Sanity CLI commands from the Studio workspace so the CLI loads the local
credentials. Before an authorized dataset write, read
`docs/agents/sanity-cli.md`.
