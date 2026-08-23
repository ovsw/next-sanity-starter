# Deployment

The Website and Studio are separate applications.

## Website on Vercel

1. Import the GitHub repository into Vercel.
2. Set the project root directory to `frontend`.
3. Add the variables from `frontend/.env.local.example`.
4. Use `main` as the production branch.
5. Require the GitHub `Release gate` check before pull requests can merge into `main`.

Vercel may create preview deployments for pull requests. Production deploys come only from verified revisions merged into `main`.

## Studio on Sanity

Add the values from `studio/.env.local.example`, then deploy manually from the repository root:

```bash
pnpm --dir studio deploy
```

Do not add Studio deployment CI. The Starter also omits one-click Vercel deployment because every copy needs its own Sanity project and credentials.

## Before the first production deploy

- Run `pnpm verify`.
- Add the Website and Studio origins to the Sanity project's CORS settings.
- Confirm the Vercel root directory is `frontend`.
- Confirm the GitHub `Release gate` check is required on `main`.
- Confirm the Studio hostname belongs to this copy of the Starter.
