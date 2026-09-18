# Content model

The Website reads structured content from one Sanity project and dataset.

## Routed content

- `homePage` owns `/`.
- `page` owns normal page slugs such as `/about/`.
- `blogIndex` owns `/blog/`.
- `post` owns `/blog/<slug>/`.
- `category` owns `/blog/category/<slug>/`.
- `redirect` maps an old path to routed content or an external URL.

## Shared content

- `settings`, `navigation`, `footer`, and `blogPostSettings` are global documents.
- `author`, `faq`, `teamMember`, and `testimonial` are reusable records.
- Pages compose top-level sections through their `blocks` array.
- `homePage`, `page`, and `blogIndex` also carry a `blocksArchive` array that
  accepts the same section types. Replaced Scaffolds move there. The Website
  reads only `blocks`.

## Section library

The Starter ships two sections and presumes no design:

- `richTextBlock` is a finished long-form section and a valid final match for a
  Scaffold.
- `scaffold` is a placeholder with `name`, `richText`, and
  `proposedSectionShape`. It renders its rich text with a visible internal
  marker so nobody mistakes it for a finished section.

Every other section belongs to its own project copy. Generate one with
`pnpm page-builder:new`.

## Page Builder path

Each section has one shared `_type` across its Studio schema, Page Builder registration, GROQ projection, generated TypeScript type, and React renderer. See `docs/agents/page-builder.md` for the extension steps.

Sanity owns authored content. The repository owns schemas, queries, rendering, routing rules, and generated types.
