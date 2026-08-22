import PortableTextRenderer from "@/components/portable-text-renderer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import Image from "next/image";
import Link from "next/link";

type AdvisorCtaBlock = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "advisorCta" }
>;

type AdvisorCtaProps = AdvisorCtaBlock & {
  dataAttribute?: (path: string) => string | undefined;
};

export default function AdvisorCta({
  _key,
  buttons,
  dataAttribute,
  eyebrow,
  portraitImage,
  richText,
  title,
  useCreamBackground,
}: AdvisorCtaProps) {
  const creamSurface = Boolean(stegaClean(useCreamBackground));
  const titleId = `advisor-cta-${stegaClean(_key)}-title`;
  const sourceWidth = portraitImage?.asset?.metadata?.dimensions?.width ?? 960;
  const sourceHeight = portraitImage?.asset?.metadata?.dimensions?.height ?? 806;

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "px-4 py-20 md:px-10 md:py-24",
        creamSurface ? "surface-cream" : "surface-white",
      )}
      data-sanity={dataAttribute?.("useCreamBackground")}
    >
      <div className="mx-auto grid w-full max-w-[70rem] items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-[clamp(2.25rem,5vw,4.5rem)]">
        <div className="relative mx-auto flex w-full max-w-[35rem] items-end justify-center">
          <div
            aria-hidden="true"
            className={cn(
              "absolute bottom-0 left-[9%] right-[9%] top-[14%] rounded-b-frame rounded-t-(--radius-arch)",
              "bg-card",
            )}
          />
          {portraitImage?.asset?._id ? (
            <Image
              alt={stegaClean(portraitImage.alt) || ""}
              blurDataURL={portraitImage.asset.metadata?.lqip || undefined}
              className="relative z-10 h-auto w-full"
              data-sanity={dataAttribute?.("portraitImage")}
              height={sourceHeight}
              loading="lazy"
              placeholder={portraitImage.asset.metadata?.lqip ? "blur" : undefined}
              sizes="(min-width: 1024px) 560px, (min-width: 768px) 420px, 88vw"
              src={urlFor(portraitImage).width(1120).fit("max").url()}
              width={sourceWidth}
            />
          ) : null}
        </div>

        <div className="flex flex-col items-start gap-5">
          {stegaClean(eyebrow)?.trim() ? (
            <p
              className="text-xs font-semibold uppercase tracking-[0.26em] text-cyan-800"
              data-sanity={dataAttribute?.("eyebrow")}
            >
              {eyebrow}
            </p>
          ) : null}
          <h2
            className="text-balance text-[clamp(1.875rem,3vw,2.5rem)] font-semibold leading-[1.12] text-slate-950"
            data-sanity={dataAttribute?.("title")}
            id={titleId}
          >
            {title}
          </h2>
          {richText?.length ? (
            <div
              className="text-pretty text-[1.03125rem] leading-[1.75] text-slate-600 [&_p]:!my-0"
              data-sanity={dataAttribute?.("richText")}
            >
              <PortableTextRenderer value={richText} />
            </div>
          ) : null}
          {buttons?.length ? (
            <div
              className="mt-1 flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
              data-sanity={dataAttribute?.("buttons")}
            >
              {buttons.slice(0, 2).map((button, index) => {
                const href = stegaClean(button.href);
                const secondary =
                  index > 0 || ["outline", "secondary"].includes(stegaClean(button.variant) || "");
                if (!href) return null;
                return (
                  <Button
                    asChild
                    className="w-full sm:w-auto"
                    key={button._key}
                    variant={secondary ? "outline" : "default"}
                  >
                    <Link
                      href={href}
                      rel={button.openInNewTab ? "noopener noreferrer" : undefined}
                      target={button.openInNewTab ? "_blank" : undefined}
                    >
                      {button.text}
                    </Link>
                  </Button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
