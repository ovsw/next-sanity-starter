import { createDataAttribute } from "next-sanity";
import type { LivePerspective } from "next-sanity/live";
import CtaBanner from "@/components/blocks/cta-banner";
import Hero from "@/components/blocks/hero";
import RichTextBlock from "@/components/blocks/rich-text-block";
import { dataset, projectId } from "@/sanity/lib/env";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";

type Block =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type BlocksProps = {
  anchorIds?: Record<string, string>;
  blocks: Block[];
  documentId: string;
  documentType?: "blogIndex" | "homePage" | "page";
  perspective: LivePerspective;
  stega: boolean;
};

export default function Blocks(props: BlocksProps) {
  const { anchorIds, blocks, documentId, documentType = "page", stega } = props;

  return (
    <>
      {blocks.map((block) => {
        const blockPath = `blocks[_key=="${block._key}"]`;
        const createAttribute = (path?: string) =>
          stega
            ? createDataAttribute({
                baseUrl:
                  process.env.NEXT_PUBLIC_STUDIO_URL ||
                  "http://localhost:3333",
                dataset,
                id: documentId,
                path: path ? `${blockPath}.${path}` : blockPath,
                projectId,
                type: documentType,
              }).toString()
            : undefined;
        const dataAttribute = (path: string) => createAttribute(path);
        const anchorId = anchorIds?.[block._key];

        let content: React.ReactNode;
        switch (block._type) {
          case "hero":
            content = <Hero {...block} dataAttribute={dataAttribute} />;
            break;
          case "richTextBlock":
            content = <RichTextBlock {...block} dataAttribute={dataAttribute} />;
            break;
          case "ctaBanner":
            content = <CtaBanner {...block} dataAttribute={dataAttribute} />;
            break;
          default:
            return null;
        }

        return (
          <div
            data-sanity={createAttribute()}
            id={anchorId}
            key={block._key}
          >
            {content}
          </div>
        );
      })}
    </>
  );
}
