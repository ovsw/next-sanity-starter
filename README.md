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
- An available Studio hostname

Install dependencies and run the guided setup:

```bash
pnpm install
pnpm setup
```

Setup asks for the site name, public URL, Sanity project ID, dataset, and Studio hostname. It writes ignored `frontend/.env.local` and `studio/.env.local` files. It does not create or change Sanity projects, datasets, CORS origins, tokens, Vercel projects, GitHub repositories, or other hosted resources.

If local env files already exist, setup stops instead of replacing them. Use `pnpm setup --force` only when you intend to replace both files.

Setup never asks for a token. Add optional preview and integration credentials to the local env files only when the matching feature needs them. The committed `.env.local.example` files list the supported names.

For repository-scoped Sanity MCP access in Codex, add `SANITY_AUTH_TOKEN` to
an ignored `.env.local` at the repository root. The committed Codex
configuration loads it when starting the MCP server.

Start both apps:

```bash
pnpm dev
```

- Website: `http://localhost:3000`
- Studio: `http://localhost:3333`

Before using Presentation, add the Website and Studio origins to your own Sanity project's CORS settings.

## Optional sample content

After setup, you can seed a new empty dataset with neutral example content:

```bash
pnpm seed
```

The seed is manual. It never runs during install, setup, development, build, or deploy. It refuses to write unless the target dataset is empty.

Seeding needs a Sanity write token in `SANITY_AUTH_TOKEN`, either in the shell or in an ignored root `.env.local`.

The sample content creates global settings, navigation, footer, the homepage, a normal `/about/` page, Blog settings, authors, categories, a Blog Post, FAQ, Team Member, Testimonial, relevant SEO values, and every retained Page Builder section. Use it to confirm Website rendering and Studio editing, then remove it before adding real project content:

```bash
pnpm unseed
```

Unseed removes only marked Starter sample documents and their Starter sample asset. It refuses partial or unmarked targets instead of emptying a dataset generally.

## Workspace commands

```bash
pnpm dev
pnpm dev:frontend
pnpm dev:studio
pnpm seed
pnpm unseed
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm typegen
```

Use plain pnpm commands from the repository root. Add workspace dependencies with `pnpm --dir frontend add <package>` or `pnpm --dir studio add <package>`.

## Deploy your copy

The Website and Studio deploy separately.

For Vercel, import your repository and set the root directory to `frontend`. Copy the Website environment values into that project's settings.

Deploy the Studio manually after configuring its hosted environment values:

```bash
pnpm --dir studio deploy
```

These commands target the accounts you configure. The Starter does not provision hosting or credentials.

## Repository layout

- `frontend/`: Next.js Website
- `studio/`: Sanity Studio, schemas, and functions
- `shared/`: code shared by both workspaces
- `docs/agents/`: repository workflow guidance

Read `docs/agents/page-builder.md` before changing Page Builder sections.

## License

The repository is available under the MIT License. Keep the copyright and permission notice in `LICENSE` when copying substantial portions of the software.
