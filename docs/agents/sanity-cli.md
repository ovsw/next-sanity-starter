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

## Page tools

Run these commands from the repository root. Each command loads
`studio/.env.local` itself. Existing shell values take precedence. They require
`SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET`, and `SANITY_AUTH_TOKEN`.
The token must allow draft reads; `page:seed --apply` needs write access.

```bash
pnpm sanity:query '*[_type == "page" && slug.current == $slug]{_id,title}' '{"slug":"getting-started"}'
pnpm page:text getting-started
pnpm page:text getting-started --published
pnpm page:seed ./example-seed.mjs
pnpm page:seed ./example-seed.mjs --apply
```

`sanity:query` prints JSON from the raw perspective, including drafts and
published documents. `page:text` prints the draft when present and otherwise
the published page. It prints the title, description, SEO text, and section
text in stored order. It does not resolve referenced documents.

`page:seed` prints its target and plan without writing unless `--apply` is
present. Follow the backup rules above before applying. The seed path is
relative to the directory where you invoke pnpm. Seed modules are executable
JavaScript; use trusted modules only. For example:

```js
export default {
  page: {
    _id: "example-page",
    slug: "example-page",
    title: "Example page",
    blocks: [],
  },
  documents: [],
};
```

Use published IDs without a `drafts.` or `versions.` prefix. Supporting documents
need `_id` and `_type`; IDs must be unique within the seed. A new page needs
a slug and title. Existing pages keep fields omitted from the seed and keep
their slug. `blocks` replaces the entire section list. Missing array keys get
stable values. Supporting drafts are replaced in full, so use IDs specific
to the page. The page update checks the draft revision to prevent overwriting
concurrent edits. The transaction writes drafts only and never publishes.
