// Shadcnblocks cta1: bordered split card with image and action.
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { buttonVariants } from "@/components/ui/button";
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
  image,
  title,
}: CtaBannerProps) {
  if (!title) return null;

  const titleId = `cta-banner-${stegaClean(_key)}-title`;
  const visibleButtons = (buttons ?? []).filter(
    (button) => getSafeLinkHref(button.href) && button.text,
  );

  return (
    <section className="py-32" aria-labelledby={titleId}>
      <div className="container">
        <div className="mx-auto flex max-w-5xl flex-col justify-between overflow-hidden rounded-lg border py-0 md:flex-row md:items-center">
          <div className="p-6 md:max-w-96 md:py-8">
            <div>
              <h2
                className="mb-2 text-3xl font-semibold"
                data-sanity={dataAttribute?.("title")}
                id={titleId}
              >
                {title}
              </h2>
              {stegaClean(description)?.trim() ? (
                <p
                  className="text-muted-foreground"
                  data-sanity={dataAttribute?.("description")}
                >
                  {description}
                </p>
              ) : null}
            </div>
            {visibleButtons.length ? (
              <div
                className="mt-8 flex flex-wrap gap-2"
                data-sanity={dataAttribute?.("buttons")}
              >
                {visibleButtons.slice(0, 2).map((button) => {
                  const href = getSafeLinkHref(button.href);
                  if (!href || !button.text) return null;
                  return (
                    <Link
                      className={buttonVariants()}
                      href={href}
                      key={button._key}
                      rel={
                        button.openInNewTab ? "noopener noreferrer" : undefined
                      }
                      target={button.openInNewTab ? "_blank" : undefined}
                    >
                      {button.text}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
          {image?.asset?._id && (
            <Image
              className="aspect-video w-full object-cover md:aspect-auto md:max-w-md md:self-stretch"
              width={640}
              height={480}
              src={urlFor(image).width(640).height(480).url()}
              alt={stegaClean(image.alt) || ""}
              data-sanity={dataAttribute?.("image")}
            />
          )}
        </div>
      </div>
    </section>
  );
}
