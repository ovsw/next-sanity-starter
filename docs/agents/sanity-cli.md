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
