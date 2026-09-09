import { simpleRichTextComponents } from "@/components/simple-rich-text";
import { urlFor } from "@/sanity/lib/image";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { PortableText, toPlainText } from "@portabletext/react";
import { stegaClean } from "next-sanity";
import Image from "next/image";
import styles from "./testimonials.module.css";

type TestimonialsProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "testimonials" }
> & {
  dataAttribute?: (path: string) => string | undefined;
  testimonialDataAttribute?: (
    documentId: string,
    path: string,
  ) => string | undefined;
};

export default function Testimonials({
  _key,
  title,
  eyebrow,
  testimonials,
  useAlternateBackground,
  dataAttribute,
  testimonialDataAttribute,
}: TestimonialsProps) {
  const cards = (testimonials ?? []).flatMap((reference) => {
    const document = reference.document;
    return document &&
      stegaClean(document.name)?.trim() &&
      document.body?.length &&
      stegaClean(toPlainText(document.body)).trim()
      ? [{ reference, document }]
      : [];
  });
  if (!cards.length) return null;
  const headingId = `testimonials-${stegaClean(_key)}-title`;
  const hasTitle = Boolean(stegaClean(title)?.trim());

  return (
    <section
      className={styles.section}
      data-alternate={stegaClean(useAlternateBackground) || undefined}
      aria-labelledby={hasTitle ? headingId : undefined}
      aria-label={hasTitle ? undefined : "Testimonials"}
    >
      <header>
        {stegaClean(eyebrow)?.trim() ? (
          <p data-sanity={dataAttribute?.("eyebrow")}>{eyebrow}</p>
        ) : null}
        {hasTitle ? (
          <h2 id={headingId} data-sanity={dataAttribute?.("title")}>
            {title}
          </h2>
        ) : null}
      </header>
      <div
        className={styles.quotes}
        role="region"
        aria-label="Customer quotes"
        tabIndex={cards.length > 1 ? 0 : undefined}
        data-sanity={dataAttribute?.("testimonials")}
      >
        {cards.map(({ reference, document }) => (
          <figure
            className={styles.quote}
            key={reference._key}
            data-sanity={dataAttribute?.(
              `testimonials[_key=="${reference._key}"]`,
            )}
          >
            <blockquote
              data-sanity={testimonialDataAttribute?.(document._id, "body")}
            >
              <PortableText
                components={simpleRichTextComponents}
                value={document.body ?? []}
              />
            </blockquote>
            <figcaption>
              {document.image?.asset?._id ? (
                <Image
                  alt={stegaClean(document.image.alt) || ""}
                  width={64}
                  height={64}
                  src={urlFor(document.image).width(128).height(128).url()}
                  data-sanity={testimonialDataAttribute?.(
                    document._id,
                    "image",
                  )}
                />
              ) : null}
              <strong
                data-sanity={testimonialDataAttribute?.(document._id, "name")}
              >
                {document.name}
              </strong>
              {stegaClean(document.title)?.trim() ? (
                <span
                  data-sanity={testimonialDataAttribute?.(
                    document._id,
                    "title",
                  )}
                >
                  {document.title}
                </span>
              ) : null}
              {typeof document.rating === "number" &&
              document.rating >= 1 &&
              document.rating <= 5 ? (
                <span
                  data-sanity={testimonialDataAttribute?.(
                    document._id,
                    "rating",
                  )}
                  aria-label={`Rated ${document.rating} out of 5`}
                >
                  {document.rating} / 5
                </span>
              ) : null}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
