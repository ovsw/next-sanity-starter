import { Button } from "@/components/ui/button";
import { getSafeLinkHref } from "@/lib/safe-href";
import { urlFor } from "@/sanity/lib/image";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import Image from "next/image";
import Link from "next/link";

type StoryFeatureBlock = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "storyFeature" }
>;

type StoryFeatureProps = StoryFeatureBlock & {
  dataAttribute?: (path: string) => string | undefined;
};

function StoryButtons({
  buttons,
  dataAttribute,
}: Readonly<Pick<StoryFeatureProps, "buttons" | "dataAttribute">>) {
  if (!buttons?.length) return null;

  return (
    <div
      className="flex w-full flex-col justify-center gap-2 sm:flex-row lg:justify-start"
      data-sanity={dataAttribute?.("buttons")}
    >
      {buttons.slice(0, 1).map((button, index) => {
        const href = getSafeLinkHref(button.href);
        const label = button.text || "Continue";

        if (!href) return null;

        return (
          <Button
            asChild
            key={button._key || `${href}-${index}`}
            variant="outline"
          >
            <Link
              href={href}
              rel={
                stegaClean(button.openInNewTab)
                  ? "noopener noreferrer"
                  : undefined
              }
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

// Layout source: https://www.shadcnblocks.com/block/feature1
// Keep the source grid, spacing, image ratio, and text alignment.
export default function StoryFeature({
  _key,
  buttons,
  dataAttribute,
  image,
  description,
  title,
}: StoryFeatureProps) {
  const headingId = `story-feature-${stegaClean(_key)}`;
  if (!stegaClean(title)?.trim()) return null;

  return (
    <section className="py-32" aria-labelledby={headingId}>
      <div className="container">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <h2
              className="mb-6 text-4xl font-semibold tracking-tight text-balance lg:text-5xl"
              id={headingId}
              data-sanity={dataAttribute?.("title")}
            >
              {title}
            </h2>
            {description ? (
              <p
                className="mb-8 max-w-xl text-muted-foreground lg:text-lg"
                data-sanity={dataAttribute?.("description")}
              >
                {description}
              </p>
            ) : null}
            <StoryButtons buttons={buttons} dataAttribute={dataAttribute} />
          </div>
          {image?.asset?._id ? (
            <Image
              alt={stegaClean(image.alt) || ""}
              className="aspect-square w-full rounded-lg border border-border object-cover"
              width={1200}
              height={1200}
              sizes="(min-width: 1280px) 584px, (min-width: 1024px) 50vw, 100vw"
              src={urlFor(image).width(1200).height(1200).url()}
              data-sanity={dataAttribute?.("image")}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
