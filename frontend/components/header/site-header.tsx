import Link from "next/link";
import DesktopNav from "./desktop-nav";
import MobileNav from "./mobile-nav";
import { HeaderBrand } from "./brand";
import { HeaderLink } from "./header-link";
import type { HeaderModel } from "./model";
import { SiteHeaderShell } from "./site-header-shell";
// Light-only for launch; see docs/adr/0001-light-theme-only-for-launch.md
// import { ModeToggle } from "@/components/menu-toggle";
import { buttonVariants } from "@/components/ui/button";

/**
 * The brand at whichever tier the viewport calls for. Three tiers, each
 * rendered once and toggled by CSS so there is no layout-shifting client-side
 * width check:
 *
 *  - stacked   — narrowest phones. The two marks sit one above the other, which
 *                is the only arrangement that leaves the main lockup a legible
 *                size once the toggle and hamburger have taken their space.
 *  - compact   — wide enough for the marks side by side, still on the hamburger.
 *  - desktop   — side by side with the full inline nav.
 *
 * The stacked→compact switch is the `xs:` breakpoint (see globals.css); it was
 * set by measuring the real marks rather than picking a device width, since the
 * assets are what determine when the row stops fitting.
 *
 * Shared by the header row and the mobile sheet so the two cannot drift apart.
 * The sheet deliberately follows the viewport rather than its own available
 * width: it is wider than the header row's brand slot and would often have room
 * for the side-by-side lockup, but taking it would mean the marks rearranged
 * themselves purely from opening the menu. Worse, at widths just under the
 * breakpoint that lockup runs into the sheet's close button.
 */
function ResponsiveBrand({ brand }: { brand: HeaderModel["brand"] }) {
  return (
    <>
      <span className="flex xs:hidden">
        <HeaderBrand brand={brand} variant="stacked" />
      </span>
      <span className="hidden xs:flex xl:hidden">
        <HeaderBrand brand={brand} variant="compact" />
      </span>
      <span className="hidden xl:flex">
        <HeaderBrand brand={brand} variant="desktop" />
      </span>
    </>
  );
}

export function Header({ model }: { model: HeaderModel }) {
  const { brand: brandModel, navigation } = model;

  const brand = <ResponsiveBrand brand={brandModel} />;

  return (
    <SiteHeaderShell>
      <div className="container-wide flex h-(--header-height) items-center justify-between gap-3 xl:gap-6">
        <Link
          aria-label="Home page"
          className="flex shrink-0 items-center rounded-control focus-ring"
          href="/"
        >
          {brand}
        </Link>
        <DesktopNav navigation={navigation} />
        <div className="hidden items-center gap-2 xl:flex xl:gap-3">
          {/* <ModeToggle /> */}
          {navigation.actions.map((action, index) => (
            <HeaderLink
              className={buttonVariants({
                size: "compact",
                variant: index === 1 ? "outline" : "primary",
              })}
              key={action.key}
              link={action.link}
            />
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-1 xl:hidden">
          {/* <ModeToggle /> */}
          <MobileNav brand={brand} navigation={navigation} />
        </div>
      </div>
    </SiteHeaderShell>
  );
}
