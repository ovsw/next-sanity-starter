# ADR 0001: Ship light theme only for launch

Date: 2026-08-10
Status: Accepted

## Context

The site had a three-option theme switcher (light / dark / system) in the
header. Two problems:

- The target audience (people shopping for a mortgage) is not technical; a
  "System" option is developer-culture leakage and mostly confusing there.
- The dark theme has known unfinished polish (popover surface sits ~1.25:1
  against the header, navy-on-navy menu shadow). Any option that exposes dark
  mode — a toggle, or silently following the OS setting — commits us to fully
  polishing and forever QA-ing every block in both themes.

The toggle was mostly a developer convenience / show-off. To minimize scope
and launch sooner, the simplest honest option is light-only: no toggle, no
dark theme, half the theming QA surface.

## Decision

- Force the light theme site-wide via next-themes `forcedTheme="light"` in
  `frontend/app/layout.tsx`. All dark styles are class-based
  (`@custom-variant dark (&:is(.dark *))` in `globals.css`, no raw
  `prefers-color-scheme` media queries), so forcing the class fully disables
  dark mode.
- Comment out the `<ModeToggle />` in
  `frontend/components/header/site-header.tsx` (two spots: desktop and mobile
  action clusters).
- Keep all the machinery in the repo — `ThemeProvider`,
  `components/menu-toggle.tsx`, all `dark:` styles — because this repo is
  intended to become a reusable project starter template.

## How to re-enable dark mode (this project or a template descendant)

1. `frontend/app/layout.tsx`: on `<ThemeProvider>`, remove
   `forcedTheme="light"` and restore the commented `defaultTheme="system"` and
   `enableSystem` props.
2. `frontend/components/header/site-header.tsx`: restore the `ModeToggle`
   import and the two commented `<ModeToggle />` usages.
3. Finish the deferred dark-mode polish pass before shipping it (surface
   contrast on popovers/menus against the header, menu shadow visibility).

If re-enabling, consider a simple two-state sun/moon toggle instead of the
old three-option dropdown: keep `defaultTheme="system"` so first-time
visitors follow their device, and have the button toggle on `resolvedTheme`
(`setTheme(resolvedTheme === "dark" ? "light" : "dark")`) with a proper
action-stating accessible label. The explicit "System" menu option is not
worth the UI cost for non-technical audiences.
