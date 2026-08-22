import { simpleRichTextComponents } from "@/components/simple-rich-text";
import { getSafeLinkHref } from "@/lib/safe-href";
import { cn } from "@/lib/utils";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { PortableText } from "@portabletext/react";
import { ArrowRight, CircleCheckBig } from "lucide-react";
import { stegaClean } from "next-sanity";
import Link from "next/link";

type LoanRequirementsProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "loanRequirements" }
> & {
  dataAttribute?: (path: string) => string | undefined;
};

type Chapter = NonNullable<LoanRequirementsProps["chapters"]>[number];
type Evidence = NonNullable<Chapter["evidence"]>[number];

function hasText(value?: string | null) {
  return Boolean(stegaClean(value)?.trim());
}

function StatRow({
  dataAttribute,
  module,
  path,
}: {
  dataAttribute?: LoanRequirementsProps["dataAttribute"];
  module: Extract<Evidence, { _type: "requirementStatRow" }>;
  path: string;
}) {
  const stats = module.stats ?? [];
  if (!stats.length) return null;

  return (
    <ul className="grid list-none grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-x-[clamp(1.5rem,3vw,2.5rem)] gap-y-6 p-0">
      {stats.map((stat) => (
        <li
          className="border-t border-border-strong pt-3.5"
          data-sanity={dataAttribute?.(`${path}.stats[_key=="${stat._key}"]`)}
          key={stat._key}
        >
          <span className="block typo-stat-md text-foreground">
            {stat.value}
          </span>
          <span className="mt-2 block typo-meta-label text-muted-foreground">
            {stat.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

function TierList({
  dataAttribute,
  module,
  path,
}: {
  dataAttribute?: LoanRequirementsProps["dataAttribute"];
  module: Extract<Evidence, { _type: "requirementTierList" }>;
  path: string;
}) {
  const tiers = module.tiers ?? [];
  if (!tiers.length) return null;

  return (
    <dl className="border-t border-border-strong">
      {tiers.map((tier, index) => (
        <div
          className={cn(
            "flex items-baseline justify-between gap-6 py-3",
            index === 0 ? "pt-3.5" : "border-t border-border",
          )}
          data-sanity={dataAttribute?.(`${path}.tiers[_key=="${tier._key}"]`)}
          key={tier._key}
        >
          <dt className="typo-body-sm text-muted-foreground">{tier.label}</dt>
          <dd className="whitespace-nowrap text-right typo-body-sm font-semibold text-foreground">
            {tier.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Checklist({
  dataAttribute,
  module,
  path,
}: {
  dataAttribute?: LoanRequirementsProps["dataAttribute"];
  module: Extract<Evidence, { _type: "requirementChecklist" }>;
  path: string;
}) {
  const items = module.items?.filter((item) => item.body?.length) ?? [];
  if (!items.length) return null;

  return (
    <ul className="grid list-none gap-3.5 border-t border-border-strong p-0 pt-4">
      {items.map((item) => (
        <li
          className="flex items-start gap-3 typo-body-sm text-muted-foreground [&_strong]:font-semibold [&_strong]:text-foreground"
          data-sanity={dataAttribute?.(`${path}.items[_key=="${item._key}"]`)}
          key={item._key}
        >
          <CircleCheckBig
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-primary"
            strokeWidth={1.7}
          />
          <span>
            <PortableText
              components={simpleRichTextComponents}
              value={item.body ?? []}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}

function EvidenceModule({
  dataAttribute,
  module,
  path,
}: {
  dataAttribute?: LoanRequirementsProps["dataAttribute"];
  module: Evidence;
  path: string;
}) {
  switch (module._type) {
    case "requirementStatRow":
      return (
        <StatRow dataAttribute={dataAttribute} module={module} path={path} />
      );
    case "requirementTierList":
      return (
        <TierList dataAttribute={dataAttribute} module={module} path={path} />
      );
    case "requirementChecklist":
      return (
        <Checklist dataAttribute={dataAttribute} module={module} path={path} />
      );
    default:
      return null;
  }
}

export default function LoanRequirements({
  _key,
  chapters,
  closingLink,
  closingNote,
  dataAttribute,
  eyebrow,
  intro,
  title,
  useCreamBackground,
}: LoanRequirementsProps) {
  const visibleChapters =
    chapters?.filter(
      (chapter) => hasText(chapter.title) && chapter.body?.length,
    ) ?? [];
  if (!visibleChapters.length) return null;

  const displayTitle = stegaClean(title)?.trim();
  const headingId = `loan-requirements-${stegaClean(_key)}`;
  const closingHref = getSafeLinkHref(closingLink?.href);
  const hasClosing = hasText(closingNote) || Boolean(closingHref);

  return (
    <section
      aria-labelledby={displayTitle ? headingId : undefined}
      className={cn(
        "scroll-mt-24 section-pad",
        stegaClean(useCreamBackground) ? "surface-cream" : "surface-white",
      )}
      id={`requirements-${stegaClean(_key)}`}
    >
      <div className="container">
        <header className="max-w-[44rem] section-header-gap">
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

        <div className="border-t border-border-strong">
          {visibleChapters.map((chapter) => {
            const chapterPath = `chapters[_key=="${chapter._key}"]`;
            const evidence = chapter.evidence?.[0];
            return (
              <article
                className="grid gap-y-5 gap-x-[clamp(2rem,5vw,4.5rem)] border-b border-border py-[clamp(2.5rem,4.5vw,3.5rem)] lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]"
                data-sanity={dataAttribute?.(chapterPath)}
                key={chapter._key}
              >
                <div>
                  {hasText(chapter.kicker) ? (
                    <p
                      className="typo-meta-label text-muted-foreground"
                      data-sanity={dataAttribute?.(`${chapterPath}.kicker`)}
                    >
                      {chapter.kicker}
                    </p>
                  ) : null}
                  <h3
                    className="mt-3 typo-subsection-heading text-foreground"
                    data-sanity={dataAttribute?.(`${chapterPath}.title`)}
                  >
                    {chapter.title}
                  </h3>
                  <div
                    className="mt-3.5 grid gap-(--space-stack) text-pretty typo-body text-muted-foreground"
                    data-sanity={dataAttribute?.(`${chapterPath}.body`)}
                  >
                    <PortableText
                      components={simpleRichTextComponents}
                      value={chapter.body ?? []}
                    />
                  </div>
                </div>
                <div className="min-w-0 lg:self-center">
                  {evidence ? (
                    <EvidenceModule
                      dataAttribute={dataAttribute}
                      module={evidence}
                      path={`${chapterPath}.evidence[_key=="${evidence._key}"]`}
                    />
                  ) : null}
                  {hasText(chapter.note) ? (
                    <p
                      className="mt-3 border-t border-border pt-3 typo-fine-print text-muted-foreground"
                      data-sanity={dataAttribute?.(`${chapterPath}.note`)}
                    >
                      {chapter.note}
                    </p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>

        {hasClosing ? (
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 pt-7">
            {hasText(closingNote) ? (
              <p
                className="max-w-[38rem] text-pretty typo-body-sm text-muted-foreground"
                data-sanity={dataAttribute?.("closingNote")}
              >
                {closingNote}
              </p>
            ) : null}
            {closingHref && hasText(closingLink?.text) ? (
              <Link
                className="inline-flex items-center gap-1.5 whitespace-nowrap typo-button text-primary transition-colors motion-fast hover:text-accent-hover focus-underline"
                data-sanity={dataAttribute?.("closingLink")}
                href={closingHref}
                rel={closingLink?.openInNewTab ? "noopener noreferrer" : undefined}
                target={closingLink?.openInNewTab ? "_blank" : undefined}
              >
                {closingLink?.text}
                <ArrowRight aria-hidden="true" className="size-3.5" />
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
