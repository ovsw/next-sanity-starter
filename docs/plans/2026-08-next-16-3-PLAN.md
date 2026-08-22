# Plan: Upgrade frontend to Next.js 16.3

_Locked via grill — by Claude + ovs_

## Goal

Upgrade the `frontend/` workspace from Next.js 16.2.10 to 16.3.0 (current stable), and adopt the two high-value opt-ins the release offers this app: **Partial Prefetching** (full adoption — every route serves an instant shell) and **TypeScript 7** for type checking. The studio workspace is untouched. _Outcome note: TypeScript 7 was **deferred** at build time — the lint toolchain (typescript-eslint ≤8.66.0) caps its peer range at TS `<6.1.0`; deferral approved by the user (see PLAN-REVIEW-LOG.md, Act 3). It is a follow-up item, potentially unblocked by a future ESLint→Biome migration._ Verification is the local suite only: build, typecheck, vitest, and the existing Playwright e2e (which already runs against a production build), plus a dev-mode smoke check of Sanity draft mode.

## Context (verified in-repo)

- Frontend: Next 16.2.10, React 19.2.7, `cacheComponents: true` already enabled, `cacheLife: { default: sanity }` from `next-sanity/live/cache-life`.
- No `loading.tsx` and no `error.tsx` anywhere — navigations likely block today; exactly the profile Partial Prefetching targets.
- Routes: 4 pages (`/`, `/[...slug]`, `/blog`, `/blog/[page]`) + 3 API routes (draft-mode enable/disable, newsletter). `proxy.ts` (not middleware.ts) handles 410s, trailing slashes, and blog pagination bounds.
- `next-sanity@13.3.1` is already latest; its peer range `next ^16.0.0-0` covers 16.3.
- TypeScript currently `^6.0.3`; frontend `typecheck` is `tsc --noEmit`.
- Vendored workflow skills in `.agents/skills/next-*` (committed in 0fd3b0c) target 16.3 — `next-partial-prefetching-adoption` is the adoption playbook; they stay.
- Deploys to Vercel (root dir `frontend/`); no CI workflows in-repo.
- Playwright `webServer` runs `pnpm build && pnpm start` — e2e exercises the prod server.

## Approach

All commands are explicit `pnpm --dir frontend <script>` (the root has no `build` script and its `test` script has different scope).

1. **Branch**: `feat/next-16-3` off `main`.
2. **Baseline** on the *unchanged* tree: `pnpm --dir frontend build`, `typecheck`, `lint`, `test`, `test:e2e` — record results so upgrade regressions are attributable. E2e and any prod-mode check run with no dev server on port 3000 (Playwright's `reuseExistingServer: !CI` would silently reuse it; run with `CI=1` or verify the port is free).
3. **Next bump only** (no TS change yet) in `frontend/package.json`:
   - `next` 16.2.10 → `16.3.0`
   - `eslint-config-next` 16.2.10 → `16.3.0`
   - `@next/third-parties` 16.2.10 → `16.3.0`
   - `pnpm install`, re-run the step-2 suite (including lint), fix what surfaces.
4. **TypeScript 7 bump, separately**: first check the resolved lint toolchain supports it — `typescript-eslint@8.63.0` in the lockfile declares support for TS `<6.1.0`. If a compatible `typescript-eslint` (or `eslint-config-next` 16.3.0's resolution) exists, bump `typescript` to `^7`, re-run suite including lint. If the lint stack does not support TS 7 yet, **stop and ask the user** before deferring — TS 7 is part of the agreed scope, so dropping it is the user's call, not a silent downgrade. _Outcome: the gate failed (no TS-7-compatible typescript-eslint exists, ≤8.66.0 all cap at `<6.1.0`); the user approved deferring TS 7 as a follow-up. TypeScript remains `^6.0.3`._
5. **Pre-flag prefetch audit** (the flag silences the diagnostics that find old full-prefetch usage, so audit first): grep for `prefetch=`, `router.prefetch(`, and any Link wrappers; record the inventory. Known state: one `prefetch={false}` on an external YouTube link, nothing else — expected result is an empty full-prefetch inventory, recorded before the flag flips.
6. **Enable Partial Prefetching**: add `partialPrefetching: true` to `next.config.mjs`.
7. **Full adoption** per the vendored `.agents/skills/next-partial-prefetching-adoption` skill:
   - Browser-driven `next dev` sweep: visit routes, work through every surfaced insight (`link-prefetch-partial`, `instant-shell-url-data`, blocking-shell validations) until none remain.
   - Known primary work item: `(main)/layout.tsx`, `page.tsx`, `blog/page.tsx`, and `[...slug]/page.tsx` all `await draftMode()` outside any Suspense boundary before rendering published UI — these top-level cookie reads are the expected shell blockers. The bar is a *useful* shell (header/body skeleton/footer), not a technically-instant empty fallback.
   - Prod-mode confirmation (`pnpm --dir frontend build && pnpm --dir frontend start`, fresh server): click through representative *valid* URLs — home, one `[...slug]` page, `/blog`, and a pagination page **selected from the links actually rendered on `/blog`** (not a hardcoded `/blog/2`, which the dataset may not support; if no pagination link exists, report that explicitly and skip the pagination shell check) — and confirm shells paint before streamed content. Representative-per-pattern, not exhaustive: shells are extracted per route pattern, so sampling each pattern proves the behavior. The out-of-range blog page is checked separately for its *expected* behavior — `proxy.ts` returns a plain-text 404 before any page renders, so it has no shell by design.
   - **Proxy prefetch check**: pagination links prefetch through `proxy.ts`, whose blog-bounds branch runs a Sanity count query per request (`useCdn` is hardcoded `false` in `sanity/lib/env.ts` — every hit reaches the Sanity API directly; no CDN layer softens this). Pagination prefetch stays ON (disabling it would defeat instant navigation on `/blog/[page]` — the goal). If prod-mode observation shows prefetches multiplying count queries, mitigate with a module-scope in-memory TTL cache (~60s) on the count in the proxy, with promise-based single-flight so concurrent cold requests share one fetch. Freshness rule: staleness ≤ TTL, per instance — the cache is per-serverless-instance best-effort on Vercel, not shared; worst case a just-(un)published post makes a boundary page briefly resolve wrong, acceptable for marketing-blog pagination and self-healing within the TTL. Prove the mitigation with numbers: record proxy request count vs. Sanity query count under a burst of concurrent requests, before and after. If the cache is implemented, extend `proxy.test.ts` with unit tests proving: concurrent misses share one request (single-flight), expiry triggers a fresh fetch, and a failed Sanity request clears the in-flight promise without caching the rejection (a retained rejected promise would break pagination until instance restart). Verify normal, draft-mode, valid, and out-of-range requests after any mitigation.
8. **AGENTS.md block**: let `next dev` write its version-matched agent-docs block; review the diff and commit it (it replaces the retired doc-mirror skills mechanism, not the vendored workflow skills).
9. **Verify** (definition of done):
   - `pnpm --dir frontend build` clean, no blocking-route validation errors
   - `typecheck` clean (under TS 7 if step 4 landed it)
   - `lint` clean
   - `test` (vitest, includes proxy.test.ts) green
   - `test:e2e` green against a fresh prod server (`CI=1`, port 3000 free)
   - Prod-mode navigation click-through from step 7 recorded (screenshots or notes in the PR)
   - Draft-mode smoke **through Studio Presentation** (not a bare hit on `/api/draft-mode/enable` — `defineEnableDraftMode` expects signed preview context): confirm draft content renders, live updates arrive, and disable works, on a `[...slug]` page and a blog route.
10. **PR** to `main` with conventional commits (`feat(frontend): upgrade to next 16.3` + follow-ups as needed). User merges; Vercel deploys from main.

## Key decisions & tradeoffs

- **Scope B, not minimal bump**: bump + Partial Prefetching + TS 7. Rejected: minimal bump (leaves the highest-value feature unused on an app with zero loading.tsx), everything-scope (experimental flags, catchError, offline — solve problems this marketing site doesn't have).
- **Full PP adoption, not flag-and-minimum**: all 4 route patterns to instant shells in one PR. The site is small enough that complete adoption is also the cheap option. Fallback if adoption balloons: **remove the flag**, land the bare version bump, and stop for user approval on how to split the rest — never ship the flag with unproven shells.
- **Verification bar is B (local suite only)**: no Vercel preview click-through, no new `instant()` Playwright regression test. User explicitly chose this over both. The prod-mode click-through in step 7 is part of the adoption work itself (PP is unobservable in dev and a passing build doesn't prove shells paint), not an extra ceremony gate.
- **TS 7 frontend-only, and conditional — resolved as deferred**: studio keeps its own TypeScript. The lint-toolchain gate failed (typescript-eslint caps at TS `<6.1.0` through 8.66.0), the user was asked and approved deferral. Delivered scope is the Next 16.3 bump + Partial Prefetching only; TS 7 is a follow-up, likely unblocked by a future ESLint→Biome migration.
- **Representative URL sampling, not exhaustive**: shells are per route pattern; navigating every generated Sanity slug is O(content) with no additional proof value.
- **Vendored next-* skills stay**: they're workflow skills (adoption/optimizer/dev-loop), not the retired doc-mirror kind; two of them exist specifically for this upgrade.
- **Experimental flags excluded**: `turbopackRustReactCompiler` (app doesn't use React Compiler), `useOffline` (no offline requirement).

## Risks / open questions

- **Unknown insight volume**: nobody knows how many PP insights will surface until the flag is on. `cacheComponents` being already enabled is a good sign, but the `await draftMode()` calls at the top of the shared layout and every page are identified expected blockers (approach step 7).
- **TS 7 native port** may flag errors the JS-based 6.x missed, and its lint-toolchain support is unconfirmed — hence the conditional, separately-sequenced bump with an explicit defer path.
- **`proxy.ts` × prefetch traffic**: PP changes prefetch patterns, and the proxy's blog-bounds branch does an uncached Sanity count fetch per matching request. Addressed by the explicit measurement + mitigation step (7) with a defined TTL-cache policy, no longer just "watched."
- **Draft mode / next-sanity live preview**: no automated coverage; the Studio Presentation smoke check is the only gate.

## Out of scope

- Studio workspace changes (including its TypeScript version)
- Experimental 16.3 flags (`turbopackRustReactCompiler`, `useOffline`)
- `catchError` error boundaries, root params, glob imports
- New `instant()` Playwright regression tests
- Vercel preview-deploy verification
- Any content/schema changes in Sanity
