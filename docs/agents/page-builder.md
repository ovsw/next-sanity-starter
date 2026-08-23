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

The section's Sanity `_type` is the shared identifier across every step. Keep it exact and use the existing hyphenated naming convention.

## Add a top-level section

Start with the closest existing section and preserve the mirrored folder structure in Studio, queries, and renderers.

1. Define the Studio schema in `studio/schemas/blocks/`.
2. Register the schema and any supporting object schemas in `studio/schema-types.ts`.
3. Add the top-level type to the Page schema's `blocks.of` list in `studio/schemas/documents/page.ts`.
4. Add the type to one insert-menu group in the same file.
5. Add its preview image at `studio/static/images/preview/<type>.jpg`. The Page schema resolves this path by `_type`.
6. Create its GROQ projection in `frontend/sanity/queries/` and interpolate it into `frontend/sanity/queries/page.ts`.
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
