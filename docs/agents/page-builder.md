# Page Builder sections

Read this guide before adding or changing a section in a page's `blocks` array.

## What the Starter ships

The Starter ships two sections and presumes no design:

- **Rich Text** (`richTextBlock`): a finished long-form section. It is a valid
  final match for a Scaffold.
- **Scaffold** (`scaffold`): a placeholder with three fields, `name`,
  `richText`, and `proposedSectionShape`. The AI page-build workflow drafts a
  whole page as Scaffolds, then replaces each one with a section from the
  project's own library. The renderer shows the rich text under a visible
  internal marker with the name and proposed shape, and sets `data-scaffold`
  on the section. `frontend/scripts/verify-no-skeleton.mjs` fails when a
  published route contains one. A Scaffold has no theme, so it always joins
  its neighbours at an edge and never shares a band.

Every page document also has a `blocksArchive` array. It accepts the same
section types as `blocks` and sits in a collapsed **Archived sections**
fieldset. Move a replaced Scaffold there instead of deleting it. The Website
never queries or renders `blocksArchive`, so nothing in it reaches a visitor.

Every other section belongs to its own project copy. There is no central
library to import from.

The [Schema UI starter guide](https://schemaui.com/docs/how-to-use) is useful for upstream examples. This repository and this guide are authoritative when they differ from the starter documentation.

## How a section reaches the page

A top-level section passes through this flow:

1. A Sanity schema defines its fields.
2. The Page schema allows editors to insert it.
3. A GROQ projection selects the data the frontend needs.
4. Sanity TypeGen turns the schema and query into TypeScript types.
5. The frontend block dispatcher selects its React renderer.

The section's Sanity `_type` is the shared identifier across every step. Use
camelCase for the type and kebab-case for filenames, as in `richTextBlock`
and `rich-text-block.ts`.

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

A generated section already follows the section theme and boundary contract
below: it has the shared `theme` field, projects `theme`, renders through
`sectionSceneClassName`, targets its theme field from empty space, and exports
a content rule that the dispatcher uses to exclude it when empty. When you
change what the renderer needs before it shows content, update that exported
rule in the same edit.

For a manual addition, preserve the mirrored folder structure:

1. Define the Studio schema in `studio/schemas/blocks/`.
2. Register the schema and any supporting object schemas in `studio/schema-types.ts`.
3. Add the type to the correct scope in `studio/schemas/blocks/page-builder.ts`. The `blocks` and `blocksArchive` fields derive from those lists.
4. If a preview is available, add `studio/static/images/preview/<type>.jpg` and register its type in the preview set in that file.
5. Create its GROQ projection in `frontend/sanity/queries/`.
6. Register the projection in `frontend/sanity/queries/page-builder.ts`.
7. Create its React renderer in `frontend/components/blocks/` and register it in the `componentMap` in `frontend/components/blocks/index.tsx`.
8. Add its field-editing type and its empty-content rule to `isRenderableBlock` in the same file. Follow the section theme and boundary contract below.
9. Run TypeGen. Do not edit `studio/schema.json` or `frontend/sanity.types.ts` by hand.

## Section themes and boundaries

Editors choose which content belongs together. Code owns the visual rules.

- **Theme.** Every finished section includes the shared field from
  `studio/schemas/blocks/shared/section-theme.ts` as its first field and
  projects `theme` in its GROQ query. The Website resolves a missing or
  unexpected value to Light with `resolveSectionTheme`. A section without a
  theme field, such as the Scaffold or a project's hero, joins every
  neighbour at an edge. Give a hero no theme field and keep its own treatment.
- **Spacing.** The renderer's outer element uses
  `sectionSceneClassName(theme, top, bottom)` and accepts `SectionSceneProps`.
  Do not add unrelated outer vertical padding. Internal content spacing stays
  with the section's design.
- **Seams and edges.** The Page Builder in `frontend/components/blocks/index.tsx`
  compares each pair of visible neighbors. Matching backgrounds form a seam and
  each side contributes half its section padding. Different backgrounds, and
  every join next to a themeless section, form an edge with full padding. The
  first and last visible sections keep full outer spacing.
- **Bands.** `resolveSectionBands` in `section-boundaries.ts` groups
  seam-joined sections into bands, and the Page Builder wraps each band in a
  div with `data-band="<theme>"` and `data-band-tuck` when its first section
  tucks. A Dark band carries one tonal sweep and one grain overlay that span
  the whole run, so the texture does not restart at a seam. The band paints
  no background; sections keep their own colour. The glow, shade, and grain
  tokens live in `frontend/app/globals.css` next to the tuck depth token.
- **Visible adjacency.** Only sections that render content take part. Each
  section's empty-content rule lives in `isRenderableBlock`, next to the
  `page-builder-generator:visible-blocks` marker, and must match the renderer's
  own empty result. Unsupported blocks are skipped the same way.
- **Empty-space editing.** The outer element carries
  `data-sanity={dataAttribute?.("theme")}` so a click on empty space in Studio
  Presentation focuses the theme field. Content elements keep their own field
  targets.
- **Theme tokens.** `.section-scene-light` and `.section-scene-dark` in
  `frontend/app/globals.css` reassign the shared color tokens, so text, links,
  buttons, cards, icons, and focus states adapt without variant changes.

### Irregular edges and tucks

Code supplies an irregular top edge; there is no editor shape selector.

1. Register the section type in `sectionEdgeTreatments` in
   `frontend/components/blocks/index.tsx`, for example `callToAction: "wave"`.
2. Have the renderer accept `topTreatment` and pass it as the fourth argument
   of `sectionSceneClassName`.
3. Give the treatment a class in `frontend/app/globals.css` that paints the
   shape with `background: inherit` and pulls the section up by the tuck depth
   with a negative top margin. Follow `.section-scene-wave-top`. The section
   above pads its bottom by the tuck depth and the crest height (the
   `[data-band]:has(+ [data-band-tuck])` rule), so content on both sides sits
   the same distance from the shape.

The resolver enables a treatment only at a different-background join. At a
seam it suppresses the treatment so no gap or third color appears. A later
section paints above the earlier one, so when both neighbors have treatments,
the lower one wins. A wave after a hero tucks the hero underneath. The Starter
ships one shallow wave shape and registers no section for it; add more shapes
only when a project needs them. Footer tucks are not shipped, but a project
copy may add one.

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
- The GROQ projection returns every field the renderer uses, including `theme` for themed sections.
- The renderer uses `sectionSceneClassName`, targets its theme field, and has a matching empty-content rule in the dispatcher.
- The Studio preview and frontend renderer work with realistic content.
- Generated files are current and are not manually edited.
- Browser-free repository verification passes:

  ```bash
  pnpm verify
  ```
