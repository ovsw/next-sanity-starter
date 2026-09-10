// Shadcnblocks blogpost1: centered prose body.
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
    <section className="container pb-24" aria-labelledby={headingId}>
      <div className="mx-auto max-w-3xl">
        {displayEyebrow || displayTitle ? (
          <header className="mb-8 space-y-4">
            {displayEyebrow ? (
              <p
                className="text-sm font-medium text-muted-foreground"
                data-sanity={dataAttribute?.("eyebrow")}
              >
                {eyebrow}
              </p>
            ) : null}
            {displayTitle ? (
              <h2
                className="text-3xl font-extrabold tracking-tight"
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
            dataSanity={dataAttribute?.("richText")}
            value={richText as PortableTextProps["value"]}
          />
        ) : null}
      </div>
    </section>
  );
}
