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
    <section aria-labelledby={titleId}>
      <div>
        <div>
          <h2
            data-sanity={dataAttribute?.("title")}
            id={titleId}
          >
            {title}
          </h2>
          {stegaClean(description)?.trim() ? (
            <p
              data-sanity={dataAttribute?.("description")}
            >
              {description}
            </p>
          ) : null}
        </div>
        {buttons?.length ? (
          <div
            data-sanity={dataAttribute?.("buttons")}
          >
            {buttons.slice(0, 2).map((button) => {
              const href = getSafeLinkHref(button.href);
              if (!href) return null;
              return (
                <Link
                  href={href}
                  key={button._key}
                  rel={button.openInNewTab ? "noopener noreferrer" : undefined}
                  target={button.openInNewTab ? "_blank" : undefined}
                >
                  {button.text}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
