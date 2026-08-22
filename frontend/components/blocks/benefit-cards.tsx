import { NavigationIcon } from "@/components/header/navigation-icon";
import { simpleRichTextComponents } from "@/components/simple-rich-text";
import { cn } from "@/lib/utils";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { PortableText } from "@portabletext/react";
import { stegaClean } from "next-sanity";

type BenefitCardsProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "benefitCards" }
> & {
  dataAttribute?: (path: string) => string | undefined;
};

function hasText(value?: string | null) {
  return Boolean(stegaClean(value)?.trim());
}

export default function BenefitCards({
  _key,
  cards,
  dataAttribute,
  eyebrow,
  intro,
  title,
  useCreamBackground,
}: BenefitCardsProps) {
  if (!cards?.length) return null;

  const displayTitle = stegaClean(title)?.trim();
  const headingId = `benefit-cards-${stegaClean(_key)}`;
  const useThreeColumns = cards.length === 3 || cards.length >= 5;

  return (
    <section
      aria-labelledby={displayTitle ? headingId : undefined}
      className={cn(
        "scroll-mt-24 section-pad",
        stegaClean(useCreamBackground) ? "surface-cream" : "surface-white",
      )}
      id={`benefits-${stegaClean(_key)}`}
    >
      <div className="container">
        <header className="max-w-2xl section-header-gap">
          {hasText(eyebrow) ? (
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
              id={headingId}
            >
              {title}
            </h2>
          ) : null}
          {hasText(intro) ? (
            <p
              className="mt-5 text-pretty typo-body-editorial text-muted-foreground"
              data-sanity={dataAttribute?.("intro")}
            >
              {intro}
            </p>
          ) : null}
        </header>

        <ol
          className={cn(
            "grid list-none gap-6 p-0 sm:grid-cols-2",
            useThreeColumns && "lg:grid-cols-3",
          )}
          data-sanity={dataAttribute?.("cards")}
        >
          {cards.map((card, index) => {
            const cardPath = `cards[_key=="${card._key}"]`;
            // stegaClean both icon parts: in draft mode Sanity injects
            // invisible stega characters into every string, and the encoded
            // svg fails NavigationIcon's fail-closed markup check.
            const iconName = stegaClean(card.icon?.name)?.trim();
            const iconSvg = stegaClean(card.icon?.svg)?.trim() || null;

            return (
              <li
                className="flex h-full flex-col gap-3.5 rounded-card border border-border bg-card p-(--space-card) text-card-foreground"
                key={card._key}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex size-[46px] items-center justify-center rounded-full bg-secondary text-primary"
                    data-sanity={dataAttribute?.(`${cardPath}.icon`)}
                  >
                    {iconName ? (
                      <NavigationIcon
                        className="size-5"
                        icon={{ name: iconName, svg: iconSvg }}
                      />
                    ) : null}
                  </div>
                  <span
                    aria-hidden="true"
                    className="text-sm font-semibold tracking-widest text-border-strong"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                {hasText(card.title) ? (
                  <h3
                    className="typo-subsection-heading text-foreground"
                    data-sanity={dataAttribute?.(`${cardPath}.title`)}
                  >
                    {card.title}
                  </h3>
                ) : null}
                {card.body?.length ? (
                  <div
                    className="grid gap-(--space-stack) text-pretty typo-body text-muted-foreground"
                    data-sanity={dataAttribute?.(`${cardPath}.body`)}
                  >
                    <PortableText
                      components={simpleRichTextComponents}
                      value={card.body}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
