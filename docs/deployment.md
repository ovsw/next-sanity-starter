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

Sanity creates the Studio app ID on the first deployment. For a new project,
run `pnpm deploy:studio --first` once, then save the app ID that Sanity prints
as `SANITY_STUDIO_APP_ID` in `studio/.env.production` and commit the file.
`--first` refuses to run when that file already has an app ID. Every later
deployment requires this ID and the production preview URL from that file,
and `SANITY_AUTH_TOKEN` from `studio/.env.local`. Shell overrides cannot replace
these values.

The preview URL must be a public HTTPS origin. Local hostnames, IP addresses,
credentials, paths, query strings, and fragments are refused. The deploy
command accepts no extra arguments. A missing setting stops deployment.

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

`init` writes the stack link to `studio/.sanity/blueprint.config.json`, which
Git ignores. Another checkout links to the same stack with
`pnpm --dir studio exec sanity blueprints config --edit --project-id <project id> --stack production`.

Test the function locally, then check its log after a publish. The log must
show that the Website expired the sync tags and that `done()` returned HTTP
2xx. The local test sends no sync tags and only simulates `done()`, so it
proves only that the function loads; the log after a real publish is the
real check.

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

## Published redirects go live in minutes

Redirects compile during the frontend build. Run this setup once for each
site, before editors use Redirects. A published Redirect create, update, or
delete then starts a production deploy. Draft edits and release versions do
not start deploys. The change is live after the deployment succeeds, usually
in a few minutes. A failed deployment leaves the previous redirects in place.

Set these values in the ignored `studio/.env.local`, or export them in your
shell. Shell values take precedence. Check the project IDs and dataset before
running the command.

- `VERCEL_TOKEN`: a token with permission to manage the site's project.
- `VERCEL_PROJECT_ID`: the site's Vercel project ID.
- `VERCEL_TEAM_ID`: the owning team ID, if the project belongs to a team.
- `SANITY_AUTH_TOKEN`: a token with permission to manage project webhooks.
- `SANITY_STUDIO_PROJECT_ID`: the site's Sanity project ID.
- `SANITY_STUDIO_DATASET`: the production dataset used by the frontend.

Connect Vercel to the Git repository and set the production branch to `main`.
Then run from the repository root:

```bash
pnpm setup:redirects
```

This creates two settings through the APIs:

- Vercel Settings > Git > Deploy Hooks: `sanity-redirects`, branch `main`.
- Sanity Manage > API > Webhooks: `sanity-redirects`, the configured dataset,
  POST, enabled, create/update/delete, filter `_type == "redirect"`, projection
  `{_id}`, API version `v2025-02-19`. Drafts and all versions are disabled.

The command passes the deploy hook URL directly to Sanity. It does not print
it or save it in the repository. Anyone with that URL can trigger a deploy.
Keep it out of logs, issue comments, and git. Matching settings are reused.
Conflicting settings stop setup without overwriting the existing hook. Fix
those settings in the service dashboard, then run the command again. If
Sanity creation fails after Vercel succeeds, rerun to reuse the Vercel hook.

Confirm the behavior on the configured site:

1. Publish a temporary Redirect with an unused source and a published target.
   Check the Sanity webhook delivery log and the Vercel production deployment.
   After it succeeds, confirm the source URL redirects to the target.
2. Change the Redirect draft without publishing. Confirm that no webhook
   delivery or deployment starts for that edit.
3. Publish the change. Confirm another deployment starts and the changed
   redirect takes effect after it succeeds.
4. Delete the test Redirect, including any draft. Confirm a deployment starts
   and the test redirect is gone after it succeeds.

Deploy Studio to show the new Redirect description to editors.
The setup command does not publish test content or trigger a deployment.

API references: [Sanity webhooks](https://www.sanity.io/docs/http-reference/webhooks),
[Vercel deploy hooks](https://vercel.com/docs/deploy-hooks), and
[Vercel's hook API client](https://github.com/vercel/terraform-provider-vercel/blob/main/client/deploy_hooks.go).
