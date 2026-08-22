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

One reusable Page Builder content and layout unit.

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
