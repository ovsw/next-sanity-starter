import { Button } from "@/components/ui/button";
import { CustomLinkMarkRenderer } from "@/components/portable-text/custom-link-mark";
import { getSafeLinkHref } from "@/lib/safe-href";
import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { stegaClean } from "next-sanity";
import Image from "next/image";
import Link from "next/link";
import type { ComponentProps } from "react";

type StoryFeatureBlock = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "storyFeature" }
>;

type StoryFeatureProps = StoryFeatureBlock & {
  dataAttribute?: (path: string) => string | undefined;
};

type ButtonVariant = NonNullable<ComponentProps<typeof Button>["variant"]>;

const storyRichTextComponents: Partial<PortableTextComponents> = {
  block: {
    normal: ({ children }) => <p>{children}</p>,
    blockquote: ({ children }) => <blockquote>{children}</blockquote>,
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc space-y-2 pl-6">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal space-y-2 pl-6">{children}</ol>,
  },
  marks: {
    customLink: CustomLinkMarkRenderer,
  },
};

function getButtonVariant(variant?: string | null): ButtonVariant {
  const cleanVariant = stegaClean(variant);
  return cleanVariant === "secondary" || cleanVariant === "outline" || cleanVariant === "link"
    ? cleanVariant
    : "default";
}

function StoryButtons({
  buttons,
  dataAttribute,
}: Readonly<Pick<StoryFeatureProps, "buttons" | "dataAttribute">>) {
  if (!buttons?.length) return null;

  return (
    <div
      className="mt-1 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
      data-sanity={dataAttribute?.("buttons")}
    >
      {buttons.slice(0, 2).map((button, index) => {
        const href = getSafeLinkHref(button.href);
        const label = button.text || "Continue";

        if (!href) return null;

        return (
          <Button
            asChild
            key={button._key || `${href}-${index}`}
            variant={getButtonVariant(button.variant)}
          >
            <Link
              href={href}
              rel={stegaClean(button.openInNewTab) ? "noopener noreferrer" : undefined}
              target={stegaClean(button.openInNewTab) ? "_blank" : undefined}
            >
              {label}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}

function KeyDetails({
  dataAttribute,
  details,
}: Readonly<{
  dataAttribute?: StoryFeatureProps["dataAttribute"];
  details?: StoryFeatureProps["keyDetails"];
}>) {
  const title = stegaClean(details?.title)?.trim();
  const items = (details?.items ?? [])
    .map((item, index) => ({ index, value: stegaClean(item)?.trim() }))
    .filter((item): item is { index: number; value: string } => Boolean(item.value))
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
            className="rounded-full border border-border bg-card px-[1.125rem] py-2 typo-body-sm font-medium text-muted-foreground"
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

export default function StoryFeature({
  _key,
  buttons,
  dataAttribute,
  eyebrow,
  image,
  imageCaption,
  keyDetails,
  richText,
  title,
  useCreamBackground,
}: StoryFeatureProps) {
  const displayEyebrow = stegaClean(eyebrow)?.trim();
  const displayTitle = stegaClean(title)?.trim();
  const displayCaption = stegaClean(imageCaption)?.trim();
  const headingId = `story-feature-${stegaClean(_key)}`;

  return (
    <section
      aria-labelledby={displayTitle ? headingId : undefined}
      className={cn(
        "section-pad",
        stegaClean(useCreamBackground) ? "surface-cream" : "surface-white",
      )}
    >
      <div className="container">
        <header className="max-w-3xl section-header-gap">
          {displayEyebrow ? (
            <p
              className="mb-3.5 typo-eyebrow text-primary"
              data-sanity={dataAttribute?.("eyebrow")}
            >
              {displayEyebrow}
            </p>
          ) : null}
          {displayTitle ? (
            <h2
              className="text-balance typo-section-heading text-foreground"
              data-sanity={dataAttribute?.("title")}
              id={headingId}
            >
              {displayTitle}
            </h2>
          ) : null}
        </header>

        <div className="grid items-stretch gap-split lg:grid-cols-[0.9fr_1.4fr]">
          <figure className="flex min-w-0 flex-col">
            {image?.asset?._id ? (
              <div
                className="relative min-h-[21.25rem] w-full flex-1 overflow-hidden rounded-card shadow-ambient-feature md:aspect-[16/9] md:min-h-0 md:flex-none lg:aspect-auto lg:min-h-[21.25rem] lg:flex-1"
                data-sanity={dataAttribute?.("image")}
              >
                <Image
                  alt={stegaClean(image.alt) || ""}
                  blurDataURL={image.asset.metadata?.lqip || undefined}
                  className="object-cover"
                  fill
                  placeholder={image.asset.metadata?.lqip ? "blur" : undefined}
                  sizes="(min-width: 1024px) 38vw, 100vw"
                  src={urlFor(image).width(1200).height(900).url()}
                />
              </div>
            ) : null}
            {displayCaption ? (
              <figcaption
                className="mt-3 typo-body-sm text-muted-foreground"
                data-sanity={dataAttribute?.("imageCaption")}
              >
                {displayCaption}
              </figcaption>
            ) : null}
          </figure>

          <div className="flex min-w-0 flex-col gap-(--space-stack)">
            {richText?.length ? (
              <div
                className="flex flex-col gap-(--space-stack) text-pretty typo-body-editorial text-muted-foreground [&_blockquote]:my-0.5 [&_blockquote]:blockquote-accent [&_blockquote]:py-0 [&_blockquote]:pl-[1.375rem] [&_blockquote]:pr-0 [&_blockquote]:text-xl [&_blockquote]:font-semibold [&_blockquote]:leading-[1.5]"
                data-sanity={dataAttribute?.("richText")}
              >
                <PortableText components={storyRichTextComponents} value={richText} />
              </div>
            ) : null}

            <KeyDetails dataAttribute={dataAttribute} details={keyDetails} />
            <StoryButtons buttons={buttons} dataAttribute={dataAttribute} />
          </div>
        </div>
      </div>
    </section>
  );
}
