# Plan Review Log: Upgrade frontend to Next.js 16.3

Act 1 (grill) complete — plan locked with the user. MAX_ROUNDS=5.

Grill outcomes: Scope B (bump + Partial Prefetching full adoption + TS 7), verification bar B (local suite only), full PP adoption across all 4 routes, studio untouched.

## Round 1 — Codex

Two assumptions are valid: `next@16.3.0` is currently npm's latest release, and Next 16.3 enables its TypeScript CLI path by default.

Material problems:

1. TypeScript 7 conflicts with the lint stack. The resolved `typescript-eslint@8.63.0` supports TypeScript `<6.1.0`, while the plan upgrades to 7 and never runs lint. Fix: Defer TS 7 or prove a TS-7-compatible lint toolchain, and add `pnpm --dir frontend lint` to every gate.
2. The definition of done cannot prove Partial Prefetching works. Its diagnostics require browser-driven `next dev`, while actual prefetching runs under `next start`; builds do not clear those diagnostics. Fix: Require a clean browser-driven development sweep, then a production-mode click-through that confirms meaningful shells paint before streamed content.
3. Playwright may silently test the development server. With `CI` unset, it reuses anything already listening on port 3000; the existing tests only use direct `page.goto()` and never exercise client navigation. Fix: Stop the dev server and force a fresh production server—such as with `CI=1`—before e2e and production click-through checks.
4. "All four routes" means four route patterns, not all actual URLs. The catch-all generates many Sanity paths, and pagination behavior varies by URL. Fix: Build a concrete queue containing every generated slug and valid blog page, then record the result of navigating each URL.
5. The likely shell blocker is understated. The shared layout, homepage, blog page, and catch-all all await `draftMode()` before returning published UI, outside their existing Suspense boundaries. Fix: Explicitly target these top-level cookie reads and require a useful header/body/footer shell—not a whole-page empty fallback.
6. Proxy load is unresolved, not merely "worth watching." Every visible pagination link can prefetch through the proxy and trigger another uncached Sanity count query. Fix: Measure prefetch query count and latency, then cache the count or disable pagination prefetch if requests multiply; test normal, draft, valid, and out-of-range requests.
7. The baseline is not a baseline, and command location is ambiguous. It combines Next and TS upgrades before the first check, while root has no `build` script and root tests have different scope. Fix: Run the current suite first, then test the Next bump, then TS separately, using explicit `pnpm --dir frontend …` commands.
8. The fallback contradicts the stated goal. "Land flag + minimum" can ship Partial Prefetching without proving every route has a usable instant shell. Fix: If full adoption fails, remove the flag and split the upgrade, or stop for user approval before changing the goal.
9. The draft-mode smoke instruction is incomplete. A bare request to `/api/draft-mode/enable` does not supply the signed preview context expected by `defineEnableDraftMode`. Fix: Enter through Studio Presentation and verify draft content, live updates, Visual Editing, and disable behavior on both catch-all and blog routes.

VERDICT: REVISE

### Claude's response

Accepted in full: #1 (TS 7 now conditional on lint-toolchain support, sequenced separately, lint added to every gate), #3 (fresh prod server / CI=1 for e2e), #5 (draftMode() blockers named as the primary work item; bar is a useful shell), #7 (true baseline first, then Next bump, then TS bump, explicit --dir commands), #8 (fallback is now remove-the-flag + stop for user approval), #9 (smoke via Studio Presentation).

Accepted reduced: #2 — dev sweep + prod-mode click-through added as part of the adoption step itself; kept inside step 6 rather than expanding the user's chosen verification bar. #6 — upgraded from "watch" to an explicit measure-and-mitigate step with the four request classes.

Rejected: #4's exhaustive URL queue. Shells are extracted per route pattern, so a representative sample per pattern (home, one slug, /blog, /blog/2, out-of-range page) yields the same proof; navigating every generated Sanity slug is O(content) ceremony with no added signal. Sampling now stated explicitly in the plan.

## Round 2 — Codex

The prior findings are largely addressed. Four material problems remain:

1. The flag is enabled before the required flag-off prefetch audit. Enabling it silences the diagnostic meant to find old full-prefetch behavior. Fix: Audit `prefetch`, `router.prefetch()`, and custom wrappers first, record the currently empty full-prefetch inventory, then enable the flag.
2. The production command is invalid: `pnpm --dir frontend build && start` runs `start` as a separate shell command. Fix: Use `pnpm --dir frontend build && pnpm --dir frontend start`.
3. The out-of-range blog URL cannot demonstrate an instant shell because `proxy.ts` returns a plain-text 404 before the page renders. Fix: Test shell painting only on valid URLs; verify the out-of-range URL separately for its expected plain-text 404 behavior.
4. `prefetch={false}` contradicts the full-adoption goal: disabling pagination prefetch means `/blog/[page]` links cannot reuse a prefetched instant shell. The alternative—caching the post count—also lacks a freshness rule when posts are published or removed. Fix: Preserve pagination prefetching and define a bounded cache/invalidation policy for the proxy count, including publish/unpublish boundary checks; otherwise explicitly narrow the instant-navigation goal.

VERDICT: REVISE

### Claude's response

All four accepted. #1: pre-flag audit inserted as step 5 (inventory recorded before the flag flips). #2: command corrected. #3: out-of-range URL reclassified as an expected-behavior check (plain-text 404 by design), shell checks limited to valid URLs. #4: pagination prefetch stays on; the `prefetch={false}` option is dropped; mitigation, if measurement demands it, is a module-scope ~60s TTL cache on the proxy count with an explicit staleness bound (≤60s on top of Sanity CDN propagation), judged acceptable for marketing-blog pagination bounds and self-healing.

## Round 3 — Codex

The prior findings are addressed: audit ordering, production command, out-of-range handling, and pagination prefetch policy are corrected. Three material problems remain:

1. The cache rationale is factually wrong. The plan assumes Sanity CDN propagation, but `useCdn` is always `false` (sanity/lib/env.ts:14), including production. Fix: Either use a dedicated CDN-enabled client for this published count query or remove the CDN assumption and define the actual freshness behavior.
2. A module-level TTL cache does not prevent concurrent cold requests from all fetching the count, and Vercel instances do not share that cache. The plan also lacks metrics proving the mitigation works. Fix: Add promise-based single-flight, describe the cache as per-instance best effort, and test concurrent requests while recording proxy requests and Sanity query counts.
3. The stated goal includes TypeScript 7, but the plan allows implementation to finish without it when lint compatibility fails. That silently changes the agreed scope. Fix: Either make TypeScript 7 optional in the goal or require user approval before deferring it.

VERDICT: REVISE

### Claude's response

All three accepted. #1: CDN assumption removed (Codex correct — `useCdn` hardcoded false); freshness rule is now the TTL itself, stated per-instance. #2: promise-based single-flight added, cache described as per-instance best-effort on Vercel, mitigation must be proven with before/after proxy-request vs. Sanity-query counts under concurrent load. #3: defer path now stops and asks the user — scope changes are the user's to approve, not a silent downgrade in a PR note.

## Round 4 — Codex

The three prior findings are addressed. Two new material gaps remain:

1. The proposed concurrent TTL cache has no automated tests for single-flight behavior, expiry, or failed Sanity requests. A retained rejected promise could break pagination until the instance restarts. Fix: Add proxy unit tests proving concurrent misses share one request, expiry triggers a new request, and failures clear the in-flight promise without caching the error.
2. The plan calls `/blog/2` valid without proving the dataset contains enough posts; content changes could make this check exercise only the proxy 404. Fix: Select a valid pagination URL from the rendered `/blog` links at runtime, and explicitly report when no paginated route currently exists to verify.

VERDICT: REVISE

### Claude's response

Both accepted. #1: if the TTL cache lands, `proxy.test.ts` gains unit tests for single-flight sharing, expiry refetch, and rejected-promise cleanup (no cached errors). #2: pagination URL is now selected from the links actually rendered on `/blog`; if none exist, that's reported and the pagination shell check is skipped explicitly.

## Round 5 — Codex

Both prior findings are addressed:

- The proxy cache now has tests for concurrency, expiry, and failed-request recovery.
- Pagination verification now selects a valid rendered link instead of assuming `/blog/2` exists.

No new material flaws found. The plan is sound enough to implement.

VERDICT: APPROVED

---
Converged after 5 rounds (4× REVISE, 1× APPROVED). Reviewer: gpt-5.6-sol via codex-cli 0.147.0, effort medium, read-only throughout.

## Act 3 — Build

### Round 1 — Codex build

Codex (gpt-5.6-sol, --yolo sandbox, thread 019fec55-cdf5-7b62-a8ba-e0a045fdeda9) implemented the headless scope in 13m25s / ~132k tokens. Report summary:

- Baseline recorded first; pre-existing lint failure found (2 errors in generated PHXHomeLoan-web-prototype/support.js) and cleared by adding the prototype dir to eslint ignores.
- Bumped next / eslint-config-next / @next/third-parties to 16.3.0 (exact pins).
- Pre-flag prefetch inventory recorded: zero prefetch={true}, zero router.prefetch(); one prefetch={false} on an external YouTube link; HeaderLink/FooterLink/SectionLink wrappers all default prefetching.
- Enabled partialPrefetching; restructured (main)/layout.tsx and all four page routes so draftMode() sits inside Suspense with useful shells (navy hero skeleton + card grid; layout keeps HeaderFallback/FooterFallback around children).
- Proxy: 60s TTL cache with promise single-flight and rejection cleanup on the blog count query; pagination prefetch preserved. proxy.test.ts extended (+6 tests: single-flight, expiry, rejection retry, main-route, draft-mode, out-of-range).
- DEVIATION: TypeScript left at ^6.0.3 — typescript-eslint (8.63.0 resolved; 8.66.0 latest) caps peer at TS <6.1.0; no TS-7-compatible lint toolchain exists. Per plan, deferred to user decision.
- All five proof commands green in Codex's run.

### Claude's verdict

Diff read in full — clean, consistent pattern, style-matched; eslint ignore addition judged in-scope (lint was a proof gate and the failure was pre-existing on the baseline). Proof re-run independently: build (89 pages, ◐ PPR on /[...slug] and /blog/[page]), typecheck, lint, 92/92 vitest, 2/2 e2e (CI=1, fresh prod server) — all green.

Browser verification (Claude, per plan step 7):
- Dev sweep: /, /blog/, /blog/2/, /apply/ — zero console errors, zero DevTools insights.
- Presentation smoke: draft mode entered via Studio, draft content rendered on /, /contact/ ([...slug]) and /blog/; live edit round-trip proven (hero heading edit streamed into preview in ~1s, reverted, byte-identical draft verified via GROQ then discarded); Disable Draft Mode works.
- Prod-mode (next start): pagination links selected from rendered /blog page (/blog/2/../5/); client-side nav to /contact/ and /blog/2/ instant; /blog/2/ initial HTML contains the shell skeleton with content streamed after (curl-verified); /blog/99/ returns proxy plain-text 404 as designed; viewport-triggered prefetch burst of all four pagination pages observed (the exact single-flight scenario the proxy cache absorbs).
- Observation: 16.3's auto-maintained AGENTS.md block did not appear during dev sessions; nothing to commit. Non-blocking — it self-maintains when Next writes it.

Verdict: build accepted, zero fix rounds needed. TS 7 deferral escalated to user (scope change per plan).
