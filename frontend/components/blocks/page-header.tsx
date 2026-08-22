import ParticleField from "@/components/particle-field";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import Link from "next/link";

type PageHeaderProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "pageHeader" }
> & {
  dataAttribute?: (path: string) => string | undefined;
};

export default function PageHeader({
  dataAttribute,
  description,
  eyebrow,
  statistics,
  title,
}: PageHeaderProps) {
  const cleanTitle = stegaClean(title)?.trim();
  const cleanEyebrow = stegaClean(eyebrow)?.trim();
  const visibleStatistics =
    statistics?.filter(
      (statistic) =>
        stegaClean(statistic.value)?.trim() &&
        stegaClean(statistic.description)?.trim(),
    ) ?? [];

  if (!cleanTitle) return null;

  return (
    <section className="relative overflow-hidden bg-[var(--phx-navy-900)] text-white section-pad-sm">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(760px 340px at 82% -10%, rgba(31,110,140,.28), transparent 68%), radial-gradient(680px 420px at 6% 118%, rgba(31,110,140,.14), transparent 70%)",
        }}
      />
      <ParticleField />

      <div className="container relative">
        {cleanEyebrow ? (
          <nav
            aria-label="Breadcrumb"
            className="mb-5 flex items-center gap-2.5 typo-fine-print font-medium text-white/55"
          >
            <Link
              className="rounded-control text-white/65 no-underline transition-colors motion-fast hover:text-white focus-ring-on-dark"
              href="/"
            >
              Home
            </Link>
            <span aria-hidden="true" className="opacity-50">
              /
            </span>
            <span
              className="typo-eyebrow text-label-on-dark"
              data-sanity={dataAttribute?.("eyebrow")}
            >
              {eyebrow}
            </span>
          </nav>
        ) : null}

        <h1
          className="max-w-[51.25rem] text-balance typo-page-heading text-white"
          data-sanity={dataAttribute?.("title")}
        >
          {title}
        </h1>
        {stegaClean(description)?.trim() ? (
          <p
            className="mt-5 max-w-[38.75rem] text-pretty typo-lead text-white/70"
            data-sanity={dataAttribute?.("description")}
          >
            {description}
          </p>
        ) : null}

        {visibleStatistics.length ? (
          <div className="mt-10 flex flex-wrap gap-x-split gap-y-8 border-t border-edge-on-dark pt-8">
            {visibleStatistics.map((statistic) => (
              <div
                className="flex w-full min-w-0 flex-col gap-1 break-words sm:w-auto sm:flex-1 sm:basis-0"
                key={statistic._key}
              >
                <p
                  className="typo-stat-md text-white"
                  data-sanity={dataAttribute?.(
                    `statistics[_key=="${statistic._key}"].value`,
                  )}
                >
                  {statistic.value}
                </p>
                <p
                  className="typo-body-sm text-white/60"
                  data-sanity={dataAttribute?.(
                    `statistics[_key=="${statistic._key}"].description`,
                  )}
                >
                  {statistic.description}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
