import Image from "next/image";
import { cn } from "@/lib/utils";
import type { HeaderBrandModel, HeaderLogoModel } from "./model";

/**
 * Sizing for the two marks, by tier.
 *
 * Which dimension is pinned depends on how the marks are arranged, because the
 * assets have quite different aspect ratios (roughly 7.7:1 and 5.5:1):
 *
 *  - Side by side, height is pinned. The two sit on one baseline, so matching
 *    heights is what makes them look like a set; their widths differ, but that
 *    reads as two logos of the same size rather than a mismatch.
 *  - Stacked, width is pinned. One sits above the other, so the eye compares
 *    their left and right edges directly. Equal heights there produced a
 *    185px main against a 105px secondary — the secondary looked like an
 *    afterthought rather than an attribution.
 *
 * The stacked widths meet in the middle of those two numbers instead of
 * shrinking one to match the other, which keeps the main mark from losing more
 * size than it has to on the narrowest screens.
 */
const LOGO_HEIGHTS = {
  desktop: { main: 27, secondary: 23 },
  /*
   * The secondary is pinned slightly taller than the main mark here, which
   * looks wrong written down and is correct on screen. Its wordmark sits below
   * a cap-height dot mark, so a good part of that box is symbol rather than
   * type; the main mark's type fills nearly all of its own. Equal box heights
   * therefore render "Luminate Bank" markedly smaller than "VERCELLINO TEAM",
   * and the main mark keeps the larger type even at these numbers.
   */
  compact: { main: 22, secondary: 22.5 },
} as const;

/*
 * Not an exact match. The secondary asset carries a tall dot mark beside its
 * wordmark, so at equal total widths its type renders larger than the main
 * lockup's — which reinstates the inverted hierarchy this split existed to fix.
 * Holding it somewhat narrower keeps the main mark the larger type while the
 * two still read as a set — the marks are centred on each other, so the widths
 * do not need to match exactly to look aligned.
 */
const STACKED_WIDTHS = { main: 168, secondary: 145 } as const;

type BrandVariant = keyof typeof LOGO_HEIGHTS | "stacked";

/** Which dimension the caller pins; the other is derived from the asset. */
type LogoSize = { axis: "height" | "width"; px: number };

function LogoImage({
  className,
  size,
  logo,
  alt,
  priority,
}: {
  className?: string;
  size: LogoSize;
  logo: HeaderLogoModel;
  alt: string;
  priority?: boolean;
}) {
  const style =
    size.axis === "height"
      ? { height: `${size.px}px`, width: "auto" as const }
      : { height: "auto" as const, width: `${size.px}px` };

  return (
    <Image
      alt={alt}
      className={cn("object-contain", className)}
      height={logo.height}
      priority={priority}
      quality={100}
      src={logo.src}
      style={style}
      width={logo.width}
    />
  );
}

/**
 * One mark, in whichever theme variant exists.
 *
 * With only a light asset uploaded the light file is inverted for dark mode.
 * That is a stopgap the schema anticipates: multi-color marks do not invert
 * cleanly, so a dedicated dark file replaces this the moment one is supplied,
 * with no code change.
 */
function ThemedLogo({
  alt,
  dark,
  size,
  light,
  priority,
}: {
  alt: string;
  dark: HeaderLogoModel | null;
  size: LogoSize;
  light: HeaderLogoModel | null;
  priority?: boolean;
}) {
  if (!light && !dark) return null;

  if (!dark) {
    return (
      <LogoImage
        alt={alt}
        className="dark:invert"
        logo={light!}
        priority={priority}
        size={size}
      />
    );
  }

  return (
    <>
      {light ? (
        <LogoImage
          alt={alt}
          className="dark:hidden"
          logo={light}
          priority={priority}
          size={size}
        />
      ) : null}
      <LogoImage
        alt={light ? "" : alt}
        className={light ? "hidden dark:block" : undefined}
        logo={dark}
        priority={priority}
        size={size}
      />
    </>
  );
}

export function HeaderBrand({
  brand,
  variant = "desktop",
}: {
  brand: HeaderBrandModel;
  variant?: BrandVariant;
}) {
  const { dark, label, light, secondary } = brand;
  const isStacked = variant === "stacked";
  const sizeFor = (mark: "main" | "secondary"): LogoSize =>
    isStacked
      ? { axis: "width", px: STACKED_WIDTHS[mark] }
      : { axis: "height", px: LOGO_HEIGHTS[variant as keyof typeof LOGO_HEIGHTS][mark] };
  const hasMain = Boolean(light || dark);
  const hasSecondary = Boolean(secondary.light || secondary.dark);

  const mainMark = hasMain ? (
    <ThemedLogo
      alt={label}
      dark={dark}
      light={light}
      priority
      size={sizeFor("main")}
    />
  ) : (
    <span className="text-lg font-semibold tracking-tight">{label}</span>
  );

  if (!hasSecondary) return mainMark;

  return (
    <span
      className={cn(
        "flex min-w-0",
        /*
         * Stacked centres the two marks on each other. They are deliberately
         * different widths, so aligning their left edges leaves the narrower
         * one visibly offset against a ragged right edge; centring reads as one
         * lockup rather than two things that failed to line up.
         */
        isStacked
          ? "flex-col items-center gap-1.5"
          : variant === "compact"
            ? "flex-row items-center gap-2"
            : "flex-row items-center gap-3 xl:gap-4",
      )}
    >
      {mainMark}
      {/*
        Divider only in the side-by-side variants. Stacked already separates the
        two marks along the axis they are read in, so a rule there would be
        stating the same break twice.
      */}
      {!isStacked ? (
        <span
          aria-hidden="true"
          className={cn(
            "w-px shrink-0 bg-border",
            variant === "compact" ? "h-5" : "h-6",
          )}
        />
      ) : null}
      <ThemedLogo
        alt={secondary.label}
        dark={secondary.dark}
        light={secondary.light}
        size={sizeFor("secondary")}
      />
    </span>
  );
}
