# Domain context

This file defines the shared language for the Starter.

## Product terms

**Starter**

This reusable repository before a project creator copies it.

**Project copy**

An independently owned repository created from the Starter. It owns its code, configuration, content, credentials, and deployments.

**Project creator**

The person who configures a project copy for a specific Website.

**Website**

The public Next.js application in `frontend/`.

**Studio**

The separately deployed Sanity editing application in `studio/`.

**Sanity project**

A hosted Sanity resource owned by the project creator. The Starter never creates or supplies one.

**Dataset**

The named content store inside the project creator's Sanity project.

**Site settings**

Global editable Website identity and content, including the site name, navigation, footer, and contact details.

**Page Builder**

The ordered section editor used to compose a page.

**Section**

One Page Builder unit with a Sanity schema, a GROQ projection, and a React renderer. The Starter ships a minimal section library: Rich Text and Scaffold. Every other section belongs to its own project copy.

**Scaffold**

A placeholder section that holds a page's intended content before a real section exists for it. It has a name, rich text, and a proposed section shape. The Website renders it with a visible internal marker during Building, and the launch check fails while one is published.

**Blocks Archive**

The `blocksArchive` array on a page document. A replaced Scaffold moves here instead of being deleted. The Website never queries or renders it.

**Draft**

Content visible to an authorized editor through preview before publication.

**Published content**

Content available to public Website visitors.

**Redirect**

A permanent route from an old public URL to its current destination.

## Ownership rules

- Code owns layout, rendering rules, validation, and safe fallbacks.
- Sanity owns editor-managed content and site settings.
- Each project copy owns its Sanity project, dataset, credentials, and hosting.
- The Starter contains no shared credentials or hosted-resource fallback identifiers.
