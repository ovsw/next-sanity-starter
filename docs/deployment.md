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

Add the local values from `studio/.env.local.example`. Confirm that the
deployed Website origin in `studio/.env.production` is correct. Then deploy
manually from the repository root:

```bash
pnpm setup:sanity-cors
pnpm deploy:studio
```

Do not add Studio deployment CI. The Starter also omits one-click Vercel deployment because every copy needs its own Sanity project and credentials.

The first deployment creates a Sanity app. Add its printed app ID to
`studio/.env.production` and commit the file. Later deployments then update the
same hosted Studio from every checkout.

## Before the first production deploy

- Run `pnpm verify`.
- Run `pnpm setup:sanity-cors`, then add every printed origin to the Sanity
  project's CORS settings with credentials enabled.
- Confirm the Vercel root directory is `frontend`.
- Confirm the GitHub `Release gate` check is required on `main`.
- Confirm the Studio hostname belongs to this copy of the Starter.
