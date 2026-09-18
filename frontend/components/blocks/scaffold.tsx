import RichTextContent from "@/components/rich-text-content";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import type { PortableTextProps } from "@portabletext/react";
import { stegaClean } from "next-sanity";
import { sectionSceneClassName, type SectionSceneProps } from "./section-boundaries";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type ScaffoldBlock = Extract<PageBlock, { _type: "scaffold" }>;

type ScaffoldProps = ScaffoldBlock & {
  dataAttribute?: (path: string) => string | undefined;
} & SectionSceneProps;

// The Page Builder excludes sections without content from visible adjacency.
// Keep this rule aligned with the renderer's empty result below.
export function hasScaffoldContent(
  block: Pick<ScaffoldBlock, "name"> & { richText?: unknown[] | null },
) {
  return Boolean(stegaClean(block.name)?.trim() || block.richText?.length);
}

// A Scaffold is a placeholder that renders during the Building phase only.
// The `data-scaffold` attribute and the visible marker exist so that no reader
// and no check mistakes it for a finished section; see
// frontend/scripts/verify-no-skeleton.mjs.
export default function Scaffold({
  _key,
  bottom = "outer",
  dataAttribute,
  name,
  proposedSectionShape,
  richText,
  top = "outer",
}: ScaffoldProps) {
  if (!hasScaffoldContent({ name, richText })) return null;

  const displayShape = stegaClean(proposedSectionShape)?.trim();
  const markerId = `scaffold-${stegaClean(_key)}-marker`;

  return (
    <section
      aria-labelledby={markerId}
      className={sectionSceneClassName("light", top, bottom)}
      data-scaffold=""
      data-sanity={dataAttribute?.("name")}
      id={`scaffold-${stegaClean(_key)}`}
    >
      <div className="container">
        <div className="mx-auto max-w-3xl">
          <dl
            className="mb-8 rounded-md border border-dashed border-foreground/50 px-4 py-3 font-mono text-sm"
            id={markerId}
          >
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-semibold">Scaffold:</dt>
              <dd data-sanity={dataAttribute?.("name")}>{name}</dd>
            </div>
            {displayShape ? (
              <div className="mt-1 flex flex-wrap gap-x-2">
                <dt className="font-semibold">Proposed shape:</dt>
                <dd data-sanity={dataAttribute?.("proposedSectionShape")}>
                  {proposedSectionShape}
                </dd>
              </div>
            ) : null}
          </dl>
          {richText?.length ? (
            <RichTextContent
              dataSanity={dataAttribute?.("richText")}
              value={richText as PortableTextProps["value"]}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
