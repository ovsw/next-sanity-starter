# Website block sources

These sections adapt Shadcnblocks layouts to Sanity content and Next.js links and images. They retain safe link checks, accessible controls, and Sanity field editing. They are adaptations, not unmodified registry files.

| Website section                | Shadcnblocks source                                             |
| ------------------------------ | --------------------------------------------------------------- |
| Hero                           | [hero1](https://www.shadcnblocks.com/block/hero1)               |
| Image and text                 | [feature1](https://www.shadcnblocks.com/block/feature1)         |
| Benefit cards and feature rows | [feature3](https://www.shadcnblocks.com/block/feature3)         |
| Timeline                       | [timeline3](https://www.shadcnblocks.com/block/timeline3)       |
| Team                           | [team1](https://www.shadcnblocks.com/block/team1)               |
| Testimonials                   | [testimonial3](https://www.shadcnblocks.com/block/testimonial3) |
| FAQ                            | [faq1](https://www.shadcnblocks.com/block/faq1)                 |
| CTA                            | [cta1](https://www.shadcnblocks.com/block/cta1)                 |
| Article cards                  | [blog1](https://www.shadcnblocks.com/block/blog1)               |
| Page headings and article body | [blogpost1](https://www.shadcnblocks.com/block/blogpost1)       |
| Article actions                | [cta3](https://www.shadcnblocks.com/block/cta3)                 |
| Website navigation             | [navbar1](https://www.shadcnblocks.com/block/navbar1)           |
| Website footer                 | [footer1](https://www.shadcnblocks.com/block/footer1)           |

Shared controls use shadcn/ui. The seed bundles neutral PNG images and uploads them to the destination dataset. It contains no source project IDs or credentials. Seed only an empty dataset. No data migration runs on existing sites.

Existing copies need a content migration when adopting these schemas: `storyFeature.richText` becomes `description`; story captions and key details are removed. Background controls and unused section labels are removed. Cards, feature rows, and CTA sections gain an image field.
