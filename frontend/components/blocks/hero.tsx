import { Button } from "@/components/ui/button";
// Adapted from licensed Shadcnblocks hero1; CMS editing attributes are retained.
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
  const visibleButtons = (buttons ?? []).filter(
    (button) => getSafeLinkHref(button.href) && button.text,
  );
  if (!cleanTitle) return null;

  const titleId = `hero-${stegaClean(_key)}-title`;

  return (
    <section className="py-32" aria-labelledby={titleId}>
      <div className="container">
        <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
          <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
            {stegaClean(eyebrow)?.trim() ? (
              <p
                className="rounded-full border px-3 py-1 text-xs font-medium"
                data-sanity={dataAttribute?.("eyebrow")}
              >
                {eyebrow}
              </p>
            ) : null}
            <h1
              className="max-w-xl text-4xl font-semibold tracking-tight text-pretty md:text-5xl lg:max-w-3xl lg:text-6xl"
              data-sanity={dataAttribute?.("title")}
              id={titleId}
            >
              {title}
            </h1>
            {body?.length ? (
              <div
                className="max-w-5xl text-balance text-muted-foreground lg:text-xl"
                data-sanity={dataAttribute?.("body")}
              >
                <PortableTextRenderer value={body} />
              </div>
            ) : null}
            {visibleButtons.length ? (
              <div
                className="flex w-full flex-col justify-center gap-2 sm:flex-row lg:justify-start"
                data-sanity={dataAttribute?.("buttons")}
              >
                {visibleButtons.map((button, index) => {
                  const href = getSafeLinkHref(button.href);
                  if (!href || !button.text) return null;
                  return (
                    <Button
                      size="lg"
                      asChild
                      variant={index === 0 ? "primary" : "outline"}
                      key={button._key}
                    >
                      <Link
                        href={href}
                        key={button._key}
                        rel={
                          button.openInNewTab
                            ? "noopener noreferrer"
                            : undefined
                        }
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
          {image?.asset?._id ? (
            <div className="overflow-hidden rounded-xl border bg-muted">
              <Image
                className="aspect-video w-full object-cover object-top"
                alt={stegaClean(image.alt) || ""}
                data-sanity={dataAttribute?.("image")}
                height={788}
                priority
                src={urlFor(image).width(1400).height(788).fit("crop").url()}
                width={1400}
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
