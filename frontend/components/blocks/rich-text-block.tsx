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
    <section aria-labelledby={headingId}>
      <div>
        {displayEyebrow || displayTitle ? (
          <header>
            {displayEyebrow ? (
              <p
                data-sanity={dataAttribute?.("eyebrow")}
              >
                {eyebrow}
              </p>
            ) : null}
            {displayTitle ? (
              <h2
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
