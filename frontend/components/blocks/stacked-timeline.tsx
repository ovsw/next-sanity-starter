import { Button } from "@/components/ui/button";
import { getSafeLinkHref } from "@/lib/safe-href";
import { urlFor } from "@/sanity/lib/image";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import Image from "next/image";
import Link from "next/link";
// Shadcnblocks timeline3: sticky introduction with milestone cards.

type StackedTimelineProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "stackedTimeline" }
> & { dataAttribute?: (path: string) => string | undefined };

export default function StackedTimeline({
  _key,
  title,
  intro,
  items,
  buttons,
  dataAttribute,
}: StackedTimelineProps) {
  const renderableItems = (items ?? []).filter(
    (item) => stegaClean(item.title)?.trim() && stegaClean(item.text)?.trim(),
  );
  if (!renderableItems.length) return null;
  const headingId = `stacked-timeline-${stegaClean(_key)}`;
  const hasTitle = Boolean(stegaClean(title)?.trim());

  return (
    <section
      className="py-32"
      aria-labelledby={hasTitle ? headingId : undefined}
    >
      <div className="container max-w-6xl">
        <div className="relative grid gap-16 md:grid-cols-2">
          <header className="top-40 h-fit md:sticky">
            {hasTitle ? (
              <h2
                className="mt-4 mb-6 text-4xl font-semibold md:text-5xl"
                id={headingId}
                data-sanity={dataAttribute?.("title")}
              >
                {title}
              </h2>
            ) : null}
            {stegaClean(intro)?.trim() ? (
              <p
                className="font-medium text-muted-foreground md:text-xl"
                data-sanity={dataAttribute?.("intro")}
              >
                {intro}
              </p>
            ) : null}
            <div
              className="mt-8 flex flex-col gap-4 lg:flex-row"
              data-sanity={dataAttribute?.("buttons")}
            >
              {(buttons ?? []).slice(0, 2).map((button) => {
                const href = getSafeLinkHref(button.href);
                if (!href || !stegaClean(button.text)?.trim()) return null;
                const variant = stegaClean(button.variant);
                return (
                  <Button
                    asChild
                    key={button._key}
                    variant={
                      variant === "secondary" ||
                      variant === "outline" ||
                      variant === "link"
                        ? variant
                        : "default"
                    }
                  >
                    <Link
                      href={href}
                      target={
                        stegaClean(button.openInNewTab) ? "_blank" : undefined
                      }
                      rel={
                        stegaClean(button.openInNewTab)
                          ? "noopener noreferrer"
                          : undefined
                      }
                    >
                      {button.text}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </header>
          <ol
            className="flex flex-col gap-12 md:gap-20"
            aria-label="Timeline"
            data-sanity={dataAttribute?.("items")}
          >
            {renderableItems.map((item) => {
              const path = `items[_key=="${item._key}"]`;
              return (
                <li className="rounded-xl border p-2" key={item._key}>
                  {item.image?.asset?._id ? (
                    <div
                      className="relative aspect-video w-full overflow-hidden rounded-xl border border-dashed"
                      data-sanity={dataAttribute?.(`${path}.image`)}
                    >
                      <Image
                        className="object-cover"
                        fill
                        alt={stegaClean(item.image.alt) || ""}
                        src={urlFor(item.image).width(1280).height(720).url()}
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        placeholder={
                          item.image.asset.metadata?.lqip ? "blur" : undefined
                        }
                        blurDataURL={
                          item.image.asset.metadata?.lqip || undefined
                        }
                      />
                    </div>
                  ) : null}
                  <div className="p-6">
                    {stegaClean(item.meta)?.trim() ? (
                      <p
                        className="mb-2 text-sm text-muted-foreground"
                        data-sanity={dataAttribute?.(`${path}.meta`)}
                      >
                        {item.meta}
                      </p>
                    ) : null}
                    <h3
                      className="mb-1 text-2xl font-semibold"
                      data-sanity={dataAttribute?.(`${path}.title`)}
                    >
                      {item.title}
                    </h3>
                    <p
                      className="text-muted-foreground"
                      data-sanity={dataAttribute?.(`${path}.text`)}
                    >
                      {item.text}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
