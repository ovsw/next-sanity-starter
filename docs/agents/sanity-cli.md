# Sanity CLI

The root Studio deployment command uses Sanity's production mode. Sanity loads
credentials from `studio/.env.local` and deployment settings from
`studio/.env.production`:

```bash
pnpm deploy:studio
```

The Sanity CLI loads `studio/.env.local` for direct commands. Run them from the
Studio workspace so it can resolve the correct environment:

```bash
pnpm --dir studio exec sanity <command>
```

This applies to dataset import and export, deployment, schema extraction, and
other Sanity CLI operations.

## Authorized dataset writes

Before the first write, identify the Sanity project and dataset from the
environment that the command will load. Create a timestamped backup and verify
it with `gzip -t`. Stop before writing if the backup or verification fails.

For document-only work, create a raw export so references remain available for
same-dataset restoration without downloading asset files:

```bash
pnpm --dir studio exec sanity datasets export <dataset> <backup>.tar.gz --raw
```

Create a full export when the work changes asset documents or references, or
uploads, replaces, or deletes assets.

Write feature content to drafts. When a migration changes stored shapes,
preserve each document's draft or published state. Publish a draft only when
the user asks.

Dataset deletion, project settings, access controls, and unrelated cleanup
need explicit user approval.
