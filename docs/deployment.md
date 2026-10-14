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

## Content goes live on publish

The Website keeps the Sanity content of each page in its cache, and each
cached read carries Sanity's sync tags: labels for the content it used.
`<SanityLive />` expires them only while a visitor has a page open, so the
Sanity Function `invalidate-tags` (`studio/functions/invalidate-tags`) does it
on every publish, with no visitor needed. This is next-sanity's "guaranteed
live content updates" setup:

1. After a publish, Sanity calls the function with the sync tags of the
   changed content.
2. The function sends them to `/api/revalidate-tags`, which expires each one.
   Every page that shows the change is fresh on its next visit, and no other
   page is.
3. The function calls `done()`, also after a failure. Only then does Sanity
   tell open pages about the change (`<SanityLive waitFor="function" />` in
   production only), so they never reload the old version. Preview
   deployments and local development keep the default behavior.

Settings for each copy of the Starter:

- Blueprint: `studio/sanity.blueprint.ts`. It reads the project and dataset
  from `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET`.
- Website variable `SANITY_REVALIDATE_SECRET`: a long random value, in Vercel
  (Production, sensitive) and in `frontend/.env.local`.
- Function variable `REVALIDATE_TAGS_URL`:
  `https://<production domain>/api/revalidate-tags`.
- Function variable `SANITY_REVALIDATE_SECRET`: the same value as the
  Website's.

Never commit the secret. The route refuses a call without it.

The first time, run these from the repository root. Skip `init` if the copy
already has a stack.

```bash
pnpm --dir studio exec sanity blueprints init --project-id <project id>
pnpm --dir studio exec sanity blueprints plan
pnpm --dir studio exec sanity blueprints deploy
pnpm --dir studio exec sanity functions env add invalidate-tags REVALIDATE_TAGS_URL https://<production domain>/api/revalidate-tags
pnpm --dir studio exec sanity functions env add invalidate-tags SANITY_REVALIDATE_SECRET <secret>
```

Test the function locally, then check its log after a publish. The log must
show that the Website expired the sync tags and that `done()` returned HTTP
2xx.

```bash
pnpm --dir studio exec sanity functions test invalidate-tags --data '{"syncTags":["test"]}' --timeout 20
pnpm --dir studio exec sanity functions logs invalidate-tags
```

Deploy a changed function with `pnpm --dir studio exec sanity blueprints deploy`.
Function runs count toward the Sanity plan's included usage; each publish
uses one.

## Before the first production deploy

- Run `pnpm verify`.
- Run `pnpm setup:sanity-cors`, then add every printed origin to the Sanity
  project's CORS settings with credentials enabled.
- Confirm the Vercel root directory is `frontend`.
- Confirm the GitHub `Release gate` check is required on `main`.
- Confirm the Studio hostname belongs to this copy of the Starter.
