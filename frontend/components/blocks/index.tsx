import { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { type LivePerspective } from "next-sanity/live";
import { createDataAttribute } from "next-sanity";
import LatestArticles from "@/components/blocks/latest-articles";
import FaqAccordion from "@/components/blocks/faq-accordion";
import StoryFeature from "@/components/blocks/story-feature";
import TeamMembers from "@/components/blocks/team-members";
import RichTextBlock from "@/components/blocks/rich-text-block";
import CtaBanner from "@/components/blocks/cta-banner";
import BenefitCards from "@/components/blocks/benefit-cards";
import Hero from "@/components/blocks/hero";
import { dataset, projectId } from "@/sanity/lib/env";

type Block =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type BlockEditingProps = {
  dataAttribute?: (path: string) => string | undefined;
  memberDataAttribute?: (
    documentId: string,
    path: string,
  ) => string | undefined;
};

const serverFieldEditingBlockTypes = new Set<Block["_type"]>([
  "faqAccordion",
  "storyFeature",
  "teamMembers",
  "richTextBlock",
  "ctaBanner",
  "benefitCards",
  "hero",
]);

const componentMap: Partial<{
  [K in Block["_type"]]: React.ComponentType<
    Extract<Block, { _type: K }> & BlockEditingProps
  >;
}> = {
  latestArticles: LatestArticles,
  faqAccordion: FaqAccordion,
  storyFeature: StoryFeature,
  teamMembers: TeamMembers,
  richTextBlock: RichTextBlock,
  ctaBanner: CtaBanner,
  benefitCards: BenefitCards,
  hero: Hero,
};

export default function Blocks({
  blocks,
  documentId,
  documentType = "page",
  stega,
}: {
  blocks: Block[];
  documentId: string;
  documentType?: "blogIndex" | "homePage" | "page";
  perspective: LivePerspective;
  stega: boolean;
}) {
  return (
    <>
      {blocks?.map((block) => {
        const Component = componentMap[block._type] as
          | React.ComponentType<Block & BlockEditingProps>
          | undefined;
        if (!Component) return null;

        const blockPath = `blocks[_key=="${block._key}"]`;
        const dataSanity = stega
          ? createDataAttribute({
              baseUrl: process.env.NEXT_PUBLIC_STUDIO_URL || "http://localhost:3333",
              dataset,
              id: documentId,
              path: blockPath,
              projectId,
              type: documentType,
            }).toString()
          : undefined;
        const dataAttribute = stega
          ? (path: string) =>
              createDataAttribute({
                baseUrl: process.env.NEXT_PUBLIC_STUDIO_URL || "http://localhost:3333",
                dataset,
                id: documentId,
                path: `${blockPath}.${path}`,
                projectId,
                type: documentType,
              }).toString()
          : undefined;
        const editingProps: BlockEditingProps =
          block._type === "teamMembers"
              ? {
                  dataAttribute,
                  memberDataAttribute: stega
                    ? (memberId: string, path: string) =>
                        createDataAttribute({
                          baseUrl:
                            process.env.NEXT_PUBLIC_STUDIO_URL ||
                            "http://localhost:3333",
                          dataset,
                          id: memberId,
                          path,
                          projectId,
                          type: "teamMember",
                        }).toString()
                    : undefined,
                }
              : serverFieldEditingBlockTypes.has(block._type)
              ? { dataAttribute }
              : {};

        return (
          <div
            data-sanity={dataSanity}
            key={block._key}
          >
            <Component {...block} {...editingProps} />
          </div>
        );
      })}
    </>
  );
}
