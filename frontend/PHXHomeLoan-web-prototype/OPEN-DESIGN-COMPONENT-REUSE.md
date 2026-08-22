# Reusing UI Across Open Design Prototype Pages

This note records the verified way to share UI across `.dc.html` prototype pages, using the DG2Go site header and footer as working examples.

## Verified approach: native Design Components

Use Open Design's native `<dc-import>` mechanism. Keep reusable markup and styles in the `components/` directory, then import them from each page. This project sets `COMPONENT_DIR` in `support.js` to `./components`, so component names still map directly to filenames.

Component file:

```text
components/DG2Go-Site-Header.dc.html
components/DG2Go-Site-Footer.dc.html
```

Consumer example:

```html
<dc-import
  name="DG2Go-Site-Header"
  active="order-pickup"
  status-color="#E8C97F"
  status-text="Schedules &amp; menus subject to change"
></dc-import>
```

The `name` maps to a filename inside `components/` without `.dc.html`. Attribute names become component props and may contain page-level template values such as `{{heroStatusLine}}`.

If an imported component contains a sticky element that must remain sticky while the page scrolls, remove the import host's layout boundary from the component stylesheet:

```css
.sc-host[data-sc-name="DG2Go-Site-Header"] { display: contents; }
```

Without this rule, the sticky element is constrained by the short `.sc-host` wrapper and stops sticking once that wrapper leaves the viewport.

## Required syntax: close `<dc-import>` explicitly

Always use a separate closing tag:

```html
<dc-import name="Example"></dc-import>
```

Do not rely on XML-style self-closing syntax in authoring:

```html
<dc-import name="Example" />
```

`<dc-import>` is a custom HTML element, not a void element. During this integration, the preview showed only the imported header while the rest of the homepage disappeared. The safe, verified correction was an explicit `</dc-import>` closing tag so all following page sections remain siblings of the import.

Although the current runtime contains normalization code for self-closing imports, the live authoring/preview path may parse the HTML before that normalization is effective. Use explicit HTML syntax and avoid depending on runtime repair.

## Page-specific state

Keep shared structure in the component and pass only page-specific state from each consumer:

- `active`: selects the active navigation state.
- `status-color`: controls the utility-bar status dot.
- `status-text`: supplies the page-specific status message.

For dynamic page values, bind existing template variables:

```html
<dc-import
  name="DG2Go-Site-Header"
  active="home"
  status-color="{{heroDotColor}}"
  status-text="{{heroStatusLine}}"
></dc-import>
```

## Correct verification workflow

Test the actual integrated pages through Open Design's renderer. Do not treat a disposable component proof as evidence that the production pages were integrated successfully.

For scrollable prototype pages, force page mode:

```sh
"$OD_NODE_BIN" "$OD_BIN" export P-Homepage.dc.html \
  --project "$OD_PROJECT_ID" --format image --page --out /tmp/homepage.png
```

The `--page` flag matters. Without it, `.dc.html` files may be inferred as design canvases, producing misleading extra-tall or stitched exports that do not represent the normal page preview.

Verify every consumer page:

- [ ] The shared utility bar, navigation, and footer render once.
- [ ] The original page content begins immediately after the header.
- [ ] Page-specific status text and status-dot color are correct.
- [ ] The correct navigation item is active.
- [ ] Sticky navigation remains sticky while the page scrolls.
- [ ] Logo and navigation links resolve correctly from every page.
- [ ] Footer links, legal copy, and active state match the current page.
- [ ] A live preview refresh still shows the complete page.
- [ ] Git shows changes in the actual consumer pages, not only proof files.

Use Open Design's renderer and preview for this work. Do not start a Python HTTP server or open a separate Chrome session unless a specific limitation requires it. A temporary Python server is unrelated to the component technology and can trigger irrelevant macOS local-network permission prompts.

## Approaches and claims to avoid

- Do not use a JavaScript Custom Element plus external CSS as the default reuse strategy here; the earlier `<dg2go-site-header>` registration did not reliably survive the Open Design preview lifecycle.
- Do not claim that Web Components are categorically unsupported. The failed attempt proved only that the chosen external-script lifecycle was unreliable in this environment.
- Do not call an isolated proof an integration test.
- Do not declare success until the actual consumer pages render with their original content intact.

## Current DG2Go implementation

The canonical shared components are:

- `components/DG2Go-Site-Header.dc.html`
- `components/DG2Go-Site-Footer.dc.html`

Both are imported by:

- `P-Homepage.dc.html`
- `P-Order-Pickup.dc.html`
- `P-Thanksgiving-Special.dc.html`

These pages use native `<dc-import>` with explicit closing tags and page-specific props. The footer receives only the `active` navigation state; its links, legal line, responsive behavior, and visual styling stay centralized. The prior JavaScript Web Component files and the disposable native-header proof are not part of the final implementation.
