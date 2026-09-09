import { Button } from "@/components/ui/button";
import { getSafeLinkHref } from "@/lib/safe-href";
import { urlFor } from "@/sanity/lib/image";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import Image from "next/image";
import Link from "next/link";
import styles from "./stacked-timeline.module.css";

type StackedTimelineProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "stackedTimeline" }
> & { dataAttribute?: (path: string) => string | undefined };

export default function StackedTimeline({
  _key,
  title,
  eyebrow,
  intro,
  items,
  buttons,
  useAlternateBackground,
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
      className={styles.section}
      data-alternate={stegaClean(useAlternateBackground) || undefined}
      aria-labelledby={hasTitle ? headingId : undefined}
    >
      <header>
        {stegaClean(eyebrow)?.trim() ? (
          <p data-sanity={dataAttribute?.("eyebrow")}>{eyebrow}</p>
        ) : null}
        {hasTitle ? (
          <h2 id={headingId} data-sanity={dataAttribute?.("title")}>
            {title}
          </h2>
        ) : null}
        {stegaClean(intro)?.trim() ? (
          <p data-sanity={dataAttribute?.("intro")}>{intro}</p>
        ) : null}
        <div
          className={styles.actions}
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
        className={styles.items}
        aria-label="Timeline"
        data-sanity={dataAttribute?.("items")}
      >
        {renderableItems.map((item) => {
          const path = `items[_key=="${item._key}"]`;
          return (
            <li className={styles.item} key={item._key}>
              {item.image?.asset?._id ? (
                <div
                  className={styles.image}
                  data-sanity={dataAttribute?.(`${path}.image`)}
                >
                  <Image
                    fill
                    alt={stegaClean(item.image.alt) || ""}
                    src={urlFor(item.image).width(1280).height(720).url()}
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    placeholder={
                      item.image.asset.metadata?.lqip ? "blur" : undefined
                    }
                    blurDataURL={item.image.asset.metadata?.lqip || undefined}
                  />
                </div>
              ) : null}
              {stegaClean(item.meta)?.trim() ? (
                <p data-sanity={dataAttribute?.(`${path}.meta`)}>{item.meta}</p>
              ) : null}
              <h3 data-sanity={dataAttribute?.(`${path}.title`)}>
                {item.title}
              </h3>
              <p data-sanity={dataAttribute?.(`${path}.text`)}>{item.text}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
