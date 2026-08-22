import Image from "next/image";
import Link from "next/link";
import { stegaClean } from "next-sanity";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { getSafeLinkHref } from "@/lib/safe-href";
import { urlFor } from "@/sanity/lib/image";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type HeroBlock = Extract<PageBlock, { _type: "hero" }>;

type HeroProps = HeroBlock & {
  dataAttribute?: (path: string) => string | undefined;
};

export default function Hero({
  _key,
  body,
  buttons,
  dataAttribute,
  eyebrow,
  image,
  title,
}: HeroProps) {
  const cleanTitle = stegaClean(title)?.trim();
  if (!cleanTitle) return null;

  const titleId = `hero-${stegaClean(_key)}-title`;

  return (
    <section
      aria-labelledby={titleId}
    >
      <div>
          {stegaClean(eyebrow)?.trim() ? (
            <p data-sanity={dataAttribute?.("eyebrow")}>
              {eyebrow}
            </p>
          ) : null}
          <h1
            data-sanity={dataAttribute?.("title")}
            id={titleId}
          >
            {title}
          </h1>
          {body?.length ? (
            <div
              data-sanity={dataAttribute?.("body")}
            >
              <PortableTextRenderer value={body} />
            </div>
          ) : null}
          {buttons?.length ? (
            <div
              data-sanity={dataAttribute?.("buttons")}
            >
              {buttons.slice(0, 2).map((button) => {
                const href = getSafeLinkHref(button.href);
                if (!href || !button.text) return null;
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
      {image?.asset?._id ? (
        <div>
          <Image
            alt={image.alt || ""}
            data-sanity={dataAttribute?.("image")}
            height={1600}
            priority
            src={urlFor(image).width(1400).height(1600).fit("crop").url()}
            width={1400}
          />
        </div>
      ) : null}
    </section>
  );
}
