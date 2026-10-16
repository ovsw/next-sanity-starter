# Raster image descriptions

Use `pnpm raster:sync` to copy Raster AI descriptions into the searchable
`description` field on matching Sanity image assets. Sanity keeps the images;
Raster supplies descriptions. The command does not copy tags or change alt text.

## Setup

Add these optional keys to `studio/.env.local`:

```dotenv
RASTER_API_KEY=<Raster API key>
RASTER_ORG_ID=<Raster organization ID>
```

Grant the API key access to the Raster library you will use. Keep these names
without the `SANITY_STUDIO_` prefix, which exposes values in the Studio bundle.
The command also needs `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET`,
and `SANITY_AUTH_TOKEN`. The token needs asset write access for `--apply`.
The command loads `studio/.env.local`; existing shell values take precedence.

## Sync new images

1. Upload the images to the Sanity media library. Keep the original file names.
2. Upload the same files to Raster with the same names.
3. Wait until Raster shows a description for each image.
4. Run `pnpm raster:sync --library <id>` from the repository root. Check the
   printed Sanity project, dataset, library, proposed images, and skipped stems.
   Without `--library`, the command selects the library with the most recent
   asset upload. Empty libraries can tie, so use an explicit ID when needed.
5. Before a write, follow the full asset backup procedure in
   [Sanity CLI](sanity-cli.md#authorized-dataset-writes). Verify the backup.
6. Run `pnpm raster:sync --library <id> --apply` with the same target.
7. Run the dry run again. It must report `To patch: 0` for unchanged inputs.
8. In Studio Media, search a word from a new description and check the result.

## Matching and skipped images

The stem is the original Sanity filename without its last extension, with
surrounding spaces removed and letters converted to lowercase. Raster already
removes the extension from its asset name. The command compares that name,
with spaces removed at each end and letters converted to lowercase, to the
Sanity stem. Names with internal dots keep those dots.

A match needs exactly one Raster asset and one Sanity asset. Duplicate Raster
names are ambiguous even if their descriptions agree or one is still empty.
Duplicate Sanity stems, such as `cabin.jpg` and `cabin.png`, are also skipped.
The dry run lists ambiguous stems. Rename conflicting files before uploading;
never rename only one copy. Undescribed Raster images are skipped.

The command fills empty descriptions and keeps existing descriptions.
`--overwrite` replaces an existing description when it differs from Raster.
Only `description` changes. Transactions contain at most 50 patches and check
asset revisions to prevent overwriting concurrent edits. If a transaction
fails, earlier transactions remain applied. Inspect the failure and run again;
already matching descriptions need no write.
