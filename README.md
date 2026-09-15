# Next.js + Sanity Starter

A reusable marketing website with a Next.js frontend and a separate Sanity Studio.

## Own your copy

Create a repository from this template, then change its code for the project you are building. Your copy has no runtime dependency on this Starter and receives no automatic Starter updates.

Each copy must use its own Sanity project, dataset, credentials, and hosting accounts. This repository contains no shared project ID, token, or hosted resource.

## Local setup

Requirements:

- Node.js 24.19.0
- pnpm 11.10.0
- An existing Sanity project ID
- A Sanity API read token
- A Sanity auth token
- An available Studio hostname

Install dependencies and run the guided setup:

```bash
pnpm install
pnpm run setup
```

Setup asks for the site name, public URL, Sanity project ID, dataset, Sanity API read token, Sanity auth token, and Studio hostname. It writes ignored `frontend/.env.local` and `studio/.env.local` files and a commit-ready `studio/.env.production` file. It does not create or change Sanity projects, datasets, CORS origins, tokens, Vercel projects, GitHub repositories, or other hosted resources.

If any target environment file already exists, setup stops instead of replacing it. Use `pnpm run setup --force` only when you intend to replace all three files.

The read token powers Sanity Presentation draft previews. The auth token powers Studio-side CLI jobs and repository-scoped Sanity MCP access in Codex. Add optional integration credentials to the local env files only when the matching feature needs them. The committed environment example files list the supported names.

The Studio uses `studio/.env.local` to preview the local Website. A production
Studio build uses the deployed Website URL in `studio/.env.production`. After
the first Studio deployment, add the app ID printed by Sanity to that production
file and commit it so every checkout updates the same hosted Studio.

Start both apps:

```bash
pnpm dev
```

- Website: `http://localhost:3000`
- Studio: `http://localhost:3333`

Before using Presentation, add the Website and Studio origins to your own Sanity project's CORS settings.

### Parallel worktrees

In a new Git worktree, copy configuration from an explicitly selected worktree
of this same repository, then start an isolated server pair:

```bash
pnpm setup:worktree --source /absolute/path/to/configured-checkout
pnpm dev:worktree
```

Setup keeps existing environment files. It copies only the Website and Studio
`.env.local` files and installs locked dependencies. If no worktree has those
files, run `pnpm setup` first.

The launcher reserves paired ports in `3000–3009` and `3333–3342`, prints both
URLs, and sets matching Website and Presentation origins. A saved assignment
is reused; a busy saved port stops the launch. To select a pair explicitly:

```bash
pnpm dev:worktree --frontend-port 3001 --studio-port 3334
```

Run `pnpm setup:sanity-cors` to print the allowed local origins and the
production Website origin. Add them with credentials enabled in your project's
Sanity CORS settings. This command does not change hosted settings.

On Linux, `pnpm dev:stop` lists this repository's development servers. Use
`pnpm dev:stop --here` to stop the current worktree's servers, `--port 3001`
to select a server, or `--all` to stop servers across this repository's
registered worktrees. The shutdown tool requires Linux `/proc`.

## Optional sample content

After setup, you can seed a new empty dataset with neutral example content:

```bash
pnpm seed
```

The seed is manual. It never runs during install, setup, development, build, or deploy. It refuses to write unless the target dataset is empty.

Seeding needs a Sanity write token in `SANITY_AUTH_TOKEN`, either in the shell or in `studio/.env.local`.

The sample content creates global settings, navigation, footer, the homepage, a normal `/about/` page, Blog settings, authors, categories, a Blog Post, FAQ, Team Member, Testimonial, relevant SEO values, and every retained Page Builder section. Use it to confirm Website rendering and Studio editing, then remove it before adding real project content:

```bash
pnpm unseed
```

Unseed removes only marked Starter sample documents and the bundled Starter sample assets. Replacement images uploaded by editors are preserved. It refuses partial or unmarked targets instead of emptying a dataset generally.

The section library includes testimonials, stacked feature rows with optional
links, and a timeline. These sections use existing shared content types and
neutral styles. Add a section with `pnpm page-builder:new <name>`; see
`docs/agents/page-builder.md` for generation, previews, and registration.

Pages accept nested slugs such as `about/our-team`. Blog routes stay reserved.
SEO sharing uses an editor-selected image when present, then a generated card.

## Workspace commands

```bash
pnpm dev
pnpm dev:frontend
pnpm dev:studio
pnpm deploy:studio
pnpm seed
pnpm unseed
pnpm verify
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm typegen
```

`pnpm verify` checks generated Sanity types, TypeScript, lint, focused tests,
both production builds, and the Playwright acceptance journey. Playwright uses
real Google Chrome in headless mode. It does not record screenshots, video, or
traces. If Chrome is missing, install it with
`pnpm --dir frontend exec playwright install chrome`.

Use plain pnpm commands from the repository root. Add workspace dependencies with `pnpm --dir frontend add <package>` or `pnpm --dir studio add <package>`.

The Studio uses the `media-6.1.8-drag.1` prerelease from the `ovsw/plugins`
fork. It adds drag-to-folder moves and Ctrl/Cmd-click asset picking from
`sanity-io/plugins#2014`. Switch back to the npm package after upstream merges
and publishes the change.

The workspace also patches this build to restore its tag icon. Check that fix
before removing or replacing the patch.

## Deploy your copy

The Website and Studio deploy separately.

For Vercel, import your repository and set the root directory to `frontend`. Copy the Website environment values into that project's settings.

Deploy the Studio manually after confirming that `SANITY_STUDIO_PREVIEW_URL`
in `studio/.env.production` contains the deployed Website origin:

```bash
pnpm setup:sanity-cors
pnpm deploy:studio
```

These commands target the accounts you configure. The Starter does not provision hosting or credentials.

See `docs/deployment.md` for the production gate and complete deployment checklist.

## Repository layout

- `frontend/`: Next.js Website
- `studio/`: Sanity Studio, schemas, and functions
- `shared/`: code shared by both workspaces
- `docs/agents/`: repository workflow guidance

Read `docs/content-model.md` for the model map and `docs/agents/page-builder.md` before changing Page Builder sections.

Before publishing a Starter revision, complete `docs/fresh-clone-proof.md` against a disposable Sanity dataset.

## License

The repository is available under the MIT License. Keep the copyright and permission notice in `LICENSE` when copying substantial portions of the software.
