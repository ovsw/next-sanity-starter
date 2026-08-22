import { cn } from "@/lib/utils";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { PortableText } from "@portabletext/react";
import { simpleRichTextComponents } from "@/components/simple-rich-text";
import { stegaClean } from "next-sanity";

type ProcessStepsProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "processSteps" }
> & {
  dataAttribute?: (path: string) => string | undefined;
};

function hasText(value?: string | null) {
  return Boolean(stegaClean(value)?.trim());
}

export default function ProcessSteps({
  _key,
  dataAttribute,
  eyebrow,
  intro,
  steps,
  title,
  useCreamBackground,
}: ProcessStepsProps) {
  if (!steps?.length) return null;

  const displayTitle = stegaClean(title)?.trim();
  const headingId = `process-steps-${stegaClean(_key)}`;

  return (
    <section
      aria-labelledby={displayTitle ? headingId : undefined}
      className={cn(
        "scroll-mt-24 section-pad",
        stegaClean(useCreamBackground) ? "surface-cream" : "surface-white",
      )}
      id={`process-${stegaClean(_key)}`}
    >
      <div className="container">
        <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.4fr] lg:gap-x-split">
          <header className="lg:sticky lg:top-[calc(var(--header-height)+2rem)]">
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

          <ol className="grid list-none gap-10 p-0 md:gap-12">
            {steps.map((step, index) => {
              const stepPath = `steps[_key=="${step._key}"]`;

              return (
                <li
                  className="relative grid grid-cols-[3rem_minmax(0,1fr)] gap-5 after:absolute after:-bottom-10 after:left-6 after:top-12 after:w-px after:bg-border after:content-[''] last:after:hidden md:after:-bottom-12"
                  key={step._key}
                >
                  <span
                    aria-hidden="true"
                    className="z-10 grid size-12 place-items-center rounded-full border border-border bg-surface-section-white font-display text-lg font-semibold text-copper-600"
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 pt-1">
                    {hasText(step.title) ? (
                      <h3
                        className="typo-subsection-heading text-foreground"
                        data-sanity={dataAttribute?.(`${stepPath}.title`)}
                      >
                        {step.title}
                      </h3>
                    ) : null}
                    {hasText(step.summary) ? (
                      <p
                        className="mt-1 typo-body-sm text-muted-foreground"
                        data-sanity={dataAttribute?.(`${stepPath}.summary`)}
                      >
                        {step.summary}
                      </p>
                    ) : null}
                    {step.body?.length ? (
                      <div
                        className="mt-5 grid gap-(--space-stack) text-pretty typo-body text-muted-foreground"
                        data-sanity={dataAttribute?.(`${stepPath}.body`)}
                      >
                        <PortableText
                          components={simpleRichTextComponents}
                          value={step.body}
                        />
                      </div>
                    ) : null}
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
