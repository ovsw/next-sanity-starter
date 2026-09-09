# Page Builder sections

Read this guide before adding or changing a section in a page's `blocks` array.

The [Schema UI starter guide](https://schemaui.com/docs/how-to-use) is useful for upstream examples. This repository and this guide are authoritative when they differ from the starter documentation.

## How a section reaches the page

A top-level section passes through this flow:

1. A Sanity schema defines its fields.
2. The Page schema allows editors to insert it.
3. A GROQ projection selects the data the frontend needs.
4. Sanity TypeGen turns the schema and query into TypeScript types.
5. The frontend block dispatcher selects its React renderer.

The section's Sanity `_type` is the shared identifier across every step. Use
camelCase for the type and kebab-case for filenames, as in `stackedFeatureRows`
and `stacked-feature-rows.ts`.

## Add a top-level section

Generate the schema, query, renderer, and registrations together:

```bash
pnpm page-builder:new serviceHighlights --title "Service highlights" --dry-run
pnpm page-builder:new serviceHighlights --title "Service highlights"
```

Use `--scope content` (the default) for shared content sections, `--scope
general` for regular pages only, or `--scope home` for the homepage only.
`--preview /path/to/image.jpg` adds a Studio grid preview. Without a preview,
Studio uses the schema's default representation. The generator refuses existing
files and serializes generator runs with `.page-builder-generator.lock`.
Remove that empty lock directory only after confirming its process has stopped.

Replace the generated fields with the real content model, then run TypeGen.
Keep the `page-builder-generator:*` markers at their registration points.

For a manual addition, preserve the mirrored folder structure:

1. Define the Studio schema in `studio/schemas/blocks/`.
2. Register the schema and any supporting object schemas in `studio/schema-types.ts`.
3. Add the type to the correct scope in `studio/schemas/blocks/page-builder.ts`. Insert-menu groups derive from those lists.
4. If a preview is available, add `studio/static/images/preview/<type>.jpg` and register its type in the preview set in that file.
5. Create its GROQ projection in `frontend/sanity/queries/`.
6. Register the projection in `frontend/sanity/queries/page-builder.ts`.
7. Create its React renderer in `frontend/components/blocks/` and register it in the `componentMap` in `frontend/components/blocks/index.tsx`.
8. Run TypeGen. Do not edit `studio/schema.json` or `frontend/sanity.types.ts` by hand.

## Add a nested block

A nested block is an object used only inside another section, such as a card inside a grid. It still needs a Studio schema registration, a parent GROQ projection, and a React renderer or parent rendering logic. It does not belong in the Page schema's `blocks.of`, Page insert-menu groups, or the top-level `componentMap` unless editors can insert it directly as a page section.

## Change an existing section

Trace the whole vertical slice before editing:

- Studio fields: `studio/schemas/blocks/`
- GROQ data shape: `frontend/sanity/queries/`
- Generated types: `frontend/sanity.types.ts`
- React rendering: `frontend/components/blocks/`

When a field is added, renamed, or removed, update the schema and projection together, regenerate types, and consider whether existing Sanity documents need compatibility handling or a migration.

For visual changes, treat the existing design system as the default:

- Reuse tokens from `frontend/app/globals.css`.
- Reuse `SectionContainer`, shared buttons, and nearby block patterns before adding a new primitive.
- Check the full page and mobile layout, not only the section in isolation.
- Introduce a one-off value or variant only when the design intentionally requires it.

## Definition of done

- The same `_type` is present at every required top-level registration point.
- The GROQ projection returns every field the renderer uses.
- The Studio preview and frontend renderer work with realistic content.
- Generated files are current and are not manually edited.
- Repository verification passes:

  ```bash
  pnpm verify
  ```
