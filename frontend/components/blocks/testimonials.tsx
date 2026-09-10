// Shadcnblocks testimonial3: centered quote and attribution.
import { PortableText, toPlainText } from "@portabletext/react";
import { simpleRichTextComponents } from "@/components/simple-rich-text";
import { urlFor } from "@/sanity/lib/image";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import Image from "next/image";
type Props = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "testimonials" }
> & {
  dataAttribute?: (path: string) => string | undefined;
  testimonialDataAttribute?: (id: string, path: string) => string | undefined;
};
export default function Testimonials({
  _key,
  title,
  testimonials,
  dataAttribute,
  testimonialDataAttribute,
}: Props) {
  const quotes = (testimonials ?? []).flatMap((r) =>
    r.document?.body?.length && stegaClean(toPlainText(r.document.body)).trim()
      ? [{ key: r._key, person: r.document }]
      : [],
  );
  if (!quotes.length) return null;
  return (
    <section
      className="py-32"
      aria-labelledby={`testimonials-${stegaClean(_key)}-title`}
    >
      <div className="container">
        <h2
          className="sr-only"
          id={`testimonials-${stegaClean(_key)}-title`}
          data-sanity={dataAttribute?.("title")}
        >
          {title || "Testimonials"}
        </h2>
        <div
          className="space-y-12"
          role="region"
          aria-label="Customer quotes"
          data-sanity={dataAttribute?.("testimonials")}
        >
          {quotes.map(({ key, person }) => (
            <figure
              key={key}
              className="flex flex-col items-center gap-6 border-y py-14 text-center md:py-20"
            >
              <blockquote
                className="block max-w-4xl text-2xl font-medium lg:text-3xl"
                data-sanity={testimonialDataAttribute?.(person._id, "body")}
              >
                <PortableText
                  components={simpleRichTextComponents}
                  value={person.body ?? []}
                />
              </blockquote>
              <figcaption className="flex flex-col items-center gap-2 sm:flex-row">
                {person.image?.asset?._id && (
                  <Image
                    className="size-8 rounded-full object-cover"
                    width={32}
                    height={32}
                    alt={stegaClean(person.image.alt) || ""}
                    src={urlFor(person.image).width(64).height(64).url()}
                    data-sanity={testimonialDataAttribute?.(
                      person._id,
                      "image",
                    )}
                  />
                )}
                <p className="font-medium">
                  <span
                    data-sanity={testimonialDataAttribute?.(person._id, "name")}
                  >
                    {person.name}
                  </span>
                  {person.title && (
                    <span
                      data-sanity={testimonialDataAttribute?.(
                        person._id,
                        "title",
                      )}
                    >
                      , {person.title}
                    </span>
                  )}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
