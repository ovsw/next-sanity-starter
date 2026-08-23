# Fresh-clone proof

Run this once before publishing a new Starter revision. Use a new repository created from the public template and a new, empty Sanity dataset owned by that repository.

1. Confirm the repository is public, marked as a template, and uses `main` as its default branch.
2. Use Node.js 24.19.0 and pnpm 11.10.0, then run `pnpm install --frozen-lockfile`.
3. Run `pnpm run setup` with the new Sanity project, dataset, tokens, Studio hostname, site name, and URL.
4. Run `pnpm seed`.
5. Run `pnpm dev`. Open the Website and Studio.
6. Confirm `/`, `/about/`, `/blog/`, and `/blog/starter-field-guide/` render the neutral seed.
7. In Presentation, edit a draft and confirm the Website preview updates without publishing it.
8. Stop both development servers, then run `pnpm verify`.
9. Run `pnpm unseed` and confirm only the marked Starter documents and asset were removed.
10. Search the repository and rendered apps for donor names, donor rules, shared credentials, fallback project IDs, and stale setup instructions.

The proof dataset must be disposable. Do not run seed or unseed against an existing project dataset.
