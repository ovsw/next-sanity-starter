import { Button } from "@/components/ui/button";
import { getSafeLinkHref } from "@/lib/safe-href";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import Link from "next/link";

type CtaBannerBlock = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "ctaBanner" }
>;

type CtaBannerProps = CtaBannerBlock & {
  dataAttribute?: (path: string) => string | undefined;
};

export default function CtaBanner({
  _key,
  buttons,
  dataAttribute,
  description,
  title,
}: CtaBannerProps) {
  if (!title) return null;

  const titleId = `cta-banner-${stegaClean(_key)}-title`;

  return (
    <section
      aria-labelledby={titleId}
      className="bg-[var(--phx-navy-800)] section-pad-sm"
    >
      <div className="container-narrow flex flex-wrap items-center justify-between gap-y-7 gap-x-12">
        <div className="max-w-xl">
          <h2
            className="text-balance typo-feature-heading text-white"
            data-sanity={dataAttribute?.("title")}
            id={titleId}
          >
            {title}
          </h2>
          {stegaClean(description)?.trim() ? (
            <p
              className="mt-2.5 text-pretty typo-body text-white/65"
              data-sanity={dataAttribute?.("description")}
            >
              {description}
            </p>
          ) : null}
        </div>
        {buttons?.length ? (
          <div
            className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap"
            data-sanity={dataAttribute?.("buttons")}
          >
            {buttons.slice(0, 2).map((button, index) => {
              const href = getSafeLinkHref(button.href);
              if (!href) return null;
              const secondary =
                index > 0 ||
                ["outline", "secondary"].includes(
                  stegaClean(button.variant) || "",
                );
              return (
                <Button
                  asChild
                  className="w-full sm:w-auto"
                  key={button._key}
                  onDark={secondary}
                  variant={secondary ? "outline" : "copper"}
                >
                  <Link
                    href={href}
                    rel={button.openInNewTab ? "noopener noreferrer" : undefined}
                    target={button.openInNewTab ? "_blank" : undefined}
                  >
                    {button.text}
                  </Link>
                </Button>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
