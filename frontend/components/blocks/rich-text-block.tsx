import RichTextContent from "@/components/rich-text-content";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import type { PortableTextProps } from "@portabletext/react";
import { stegaClean } from "next-sanity";

type RichTextBlockData = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "richTextBlock" }
>;

type RichTextBlockProps = RichTextBlockData & {
  dataAttribute?: (path: string) => string | undefined;
};

export default function RichTextBlock({
  _key,
  dataAttribute,
  eyebrow,
  richText,
  title,
}: RichTextBlockProps) {
  const displayEyebrow = stegaClean(eyebrow)?.trim();
  const displayTitle = stegaClean(title)?.trim();
  const headingId = displayTitle
    ? `rich-text-${stegaClean(_key)}-title`
    : undefined;

  if (!(displayEyebrow || displayTitle || richText?.length)) return null;

  return (
    <section
      aria-labelledby={headingId}
      className="my-6 md:my-16"
    >
      <div className="container">
        {displayEyebrow || displayTitle ? (
          <header className="mx-auto max-w-4xl text-center">
            {displayEyebrow ? (
              <p
                className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-primary"
                data-sanity={dataAttribute?.("eyebrow")}
              >
                {eyebrow}
              </p>
            ) : null}
            {displayTitle ? (
              <h2
                className="text-balance text-3xl font-semibold leading-tight text-foreground md:text-5xl"
                data-sanity={dataAttribute?.("title")}
                id={headingId}
              >
                {title}
              </h2>
            ) : null}
          </header>
        ) : null}
        {richText?.length ? (
          <RichTextContent
            className="mx-auto mt-8 max-w-4xl"
            dataSanity={dataAttribute?.("richText")}
            value={richText as PortableTextProps["value"]}
          />
        ) : null}
      </div>
    </section>
  );
}
