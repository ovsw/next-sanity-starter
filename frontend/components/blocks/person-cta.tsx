import PortableTextRenderer from "@/components/portable-text-renderer";
import { Button } from "@/components/ui/button";
import { getSafeLinkHref } from "@/lib/safe-href";
import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import Image from "next/image";
import Link from "next/link";

type PersonCtaBlock = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "personCta" }
>;

type PersonCtaProps = PersonCtaBlock & {
  dataAttribute?: (path: string) => string | undefined;
};

function KeyDetails({
  dataAttribute,
  details,
}: Readonly<{
  dataAttribute?: PersonCtaProps["dataAttribute"];
  details?: PersonCtaProps["keyDetails"];
}>) {
  const title = stegaClean(details?.title)?.trim();
  const items = (details?.items ?? [])
    .map((item, index) => ({ index, value: stegaClean(item)?.trim() }))
    .filter((item): item is { index: number; value: string } =>
      Boolean(item.value),
    )
    .slice(0, 8);

  if (!items.length) return null;

  return (
    <div className="mt-1">
      {title ? (
        <p
          className="mb-4 typo-eyebrow text-muted-foreground"
          data-sanity={dataAttribute?.("keyDetails.title")}
        >
          {title}
        </p>
      ) : null}
      <ul className="flex list-none flex-wrap gap-2.5 p-0">
        {items.map((item) => (
          <li
            className={cn(
              "rounded-full border border-border bg-card px-[1.125rem] py-2 typo-body-sm font-medium text-muted-foreground",
            )}
            data-sanity={dataAttribute?.(`keyDetails.items[${item.index}]`)}
            key={`${item.value}-${item.index}`}
          >
            {item.value}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PersonButtons({
  buttons,
  dataAttribute,
}: Readonly<Pick<PersonCtaProps, "buttons" | "dataAttribute">>) {
  if (!buttons?.length) return null;

  return (
    <div
      className="mt-1 flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
      data-sanity={dataAttribute?.("buttons")}
    >
      {buttons.slice(0, 2).map((button, index) => {
        const href = getSafeLinkHref(button.href);
        const variant = stegaClean(button.variant);
        const secondary =
          index > 0 || variant === "outline" || variant === "secondary";

        if (!href) return null;

        return (
          <Button
            asChild
            className="w-full sm:w-auto"
            key={button._key || `${href}-${index}`}
            variant={secondary ? "outline" : "default"}
          >
            <Link
              href={href}
              rel={stegaClean(button.openInNewTab) ? "noopener noreferrer" : undefined}
              target={stegaClean(button.openInNewTab) ? "_blank" : undefined}
            >
              {button.text || "Continue"}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}

export default function PersonCta({
  _key,
  buttons,
  dataAttribute,
  eyebrow,
  keyDetails,
  personImage,
  richText,
  title,
  useCreamBackground,
}: PersonCtaProps) {
  const creamSurface = Boolean(stegaClean(useCreamBackground));
  const displayEyebrow = stegaClean(eyebrow)?.trim();
  const displayTitle = stegaClean(title)?.trim();
  const titleId = _key
    ? `person-cta-${stegaClean(_key)}-title`
    : undefined;
  const sourceWidth = personImage?.asset?.metadata?.dimensions?.width ?? 680;
  const sourceHeight = personImage?.asset?.metadata?.dimensions?.height ?? 806;

  return (
    <section
      aria-labelledby={displayTitle ? titleId : undefined}
      className={cn(
        "section-pad",
        creamSurface ? "surface-cream" : "surface-white",
      )}
    >
      <div className="container-narrow grid items-center gap-split min-[700px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-6">
        <div className="relative mx-auto flex w-full max-w-[18.75rem] items-end justify-center sm:max-w-[20rem] lg:max-w-none">
          <div
            aria-hidden="true"
            className={cn(
              "absolute bottom-0 left-[8%] right-[8%] top-[16%] rounded-b-frame rounded-t-(--radius-arch)",
              "bg-card",
            )}
          />
          {personImage?.asset?._id ? (
            <Image
              alt={stegaClean(personImage.alt) || ""}
              blurDataURL={personImage.asset.metadata?.lqip || undefined}
              className="relative z-10 h-auto w-full"
              data-sanity={dataAttribute?.("personImage")}
              height={sourceHeight}
              loading="lazy"
              placeholder={personImage.asset.metadata?.lqip ? "blur" : undefined}
              sizes="(min-width: 1024px) 600px, (min-width: 700px) 38vw, (min-width: 640px) 320px, 300px"
              src={personImage.asset.url || urlFor(personImage).width(960).fit("max").url()}
              width={sourceWidth}
            />
          ) : null}
        </div>

        <div className="grid justify-items-start gap-5">
          {displayEyebrow || displayTitle ? (
            <div>
              {displayEyebrow ? (
                <p
                  className="mb-3.5 typo-eyebrow text-primary"
                  data-sanity={dataAttribute?.("eyebrow")}
                >
                  {eyebrow}
                </p>
              ) : null}
              {displayTitle ? (
                <h2
                  className="text-balance typo-section-heading text-foreground"
                  data-sanity={dataAttribute?.("title")}
                  id={titleId}
                >
                  {title}
                </h2>
              ) : null}
            </div>
          ) : null}
          {richText?.length ? (
            <div
              className="text-pretty typo-body-editorial text-muted-foreground [&_p]:!my-0"
              data-sanity={dataAttribute?.("richText")}
            >
              <PortableTextRenderer value={richText} />
            </div>
          ) : null}
          <KeyDetails
            dataAttribute={dataAttribute}
            details={keyDetails}
          />
          <PersonButtons buttons={buttons} dataAttribute={dataAttribute} />
        </div>
      </div>
    </section>
  );
}
