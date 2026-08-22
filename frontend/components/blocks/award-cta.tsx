import { Button } from "@/components/ui/button";
import ParticleField from "@/components/particle-field";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import Image from "next/image";
import Link from "next/link";
type AwardCtaProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "awardCta" }
>;

const TROPHY_SRC = "/images/phx-award-trophy.png";
const DEFAULT_EYEBROW = "A track record you can verify";

function normalizeHighlight(highlight?: string | null) {
  if (!highlight) return null;

  return stegaClean(highlight).trim().toUpperCase() === "TOP 1%"
    ? "Top 1%"
    : highlight;
}

function AwardHeading({
  highlight,
  title,
}: Pick<AwardCtaProps, "highlight" | "title">) {
  const normalizedHighlight = normalizeHighlight(highlight);

  if (!normalizedHighlight && !title) return null;

  if (
    normalizedHighlight &&
    stegaClean(title)?.trim() === "Mortgage Loan Originators"
  ) {
    return (
      <h2 className="text-[clamp(3rem,5.2vw,4.125rem)] font-semibold leading-[1.05] tracking-normal text-white">
        <span className="sm:whitespace-nowrap">
          &ldquo;{normalizedHighlight} Mortgage
        </span>
        <br />
        <span className="sm:whitespace-nowrap">Loan Originators&rdquo;</span>
      </h2>
    );
  }

  return (
    <h2 className="text-balance text-[clamp(3rem,5.2vw,4.125rem)] font-semibold leading-[1.05] tracking-normal text-white">
      &ldquo;{[normalizedHighlight, title].filter(Boolean).join(" ")}&rdquo;
    </h2>
  );
}

export default function AwardCta({
  buttons,
  description,
  highlight,
  title,
}: AwardCtaProps) {
  return (
    <section
      className="relative isolate overflow-hidden bg-[var(--phx-navy-800)] text-white section-pad-lg"
      id="award-cta"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(900px_400px_at_50%_120%,rgba(31,110,140,0.24),transparent_70%)]"
      />
      <ParticleField />

      <div className="container-narrow relative z-10 flex flex-col items-center justify-center gap-split text-center lg:flex-row lg:text-left">
        <div className="flex shrink-0 justify-center">
          <div className="relative aspect-[900/1256] h-[17rem] md:h-[22rem] lg:h-[28.75rem]">
            <Image
              alt="Top 1% award trophy"
              className="rounded-none object-contain drop-shadow-[0_30px_50px_rgba(0,0,0,0.5)]"
              fill
              sizes="(min-width: 1024px) 420px, 70vw"
              src={TROPHY_SRC}
            />
          </div>
        </div>

        <div className="flex max-w-xl flex-col items-center gap-5 lg:items-start">
          <p className="typo-eyebrow text-white/55">
            {DEFAULT_EYEBROW}
          </p>
          <AwardHeading highlight={highlight} title={title} />
          {description ? (
            <p className="text-pretty typo-body-editorial text-white/65">
              {description}
            </p>
          ) : null}
          {buttons?.length ? (
            <div className="mt-3 flex w-full flex-col justify-center gap-4 sm:w-auto sm:flex-row lg:justify-start">
              {buttons.map((button, index) => {
                const href = stegaClean(button.href);
                if (!href) return null;

                return (
                  <Button
                    asChild
                    className="w-full sm:w-auto"
                    emphasis
                    key={button._key || `${href}-${index}`}
                    size="hero"
                  >
                    <Link
                      href={href}
                      rel={button.openInNewTab ? "noopener noreferrer" : undefined}
                      target={button.openInNewTab ? "_blank" : undefined}
                    >
                      {button.text || "Learn More"}
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
