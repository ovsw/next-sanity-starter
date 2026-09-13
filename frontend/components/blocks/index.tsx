import { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { type LivePerspective } from "next-sanity/live";
import { createDataAttribute, stegaClean } from "next-sanity";
import LatestArticles from "@/components/blocks/latest-articles";
import FaqAccordion from "@/components/blocks/faq-accordion";
import StoryFeature from "@/components/blocks/story-feature";
import TeamMembers from "@/components/blocks/team-members";
import RichTextBlock from "@/components/blocks/rich-text-block";
import CtaBanner from "@/components/blocks/cta-banner";
import BenefitCards from "@/components/blocks/benefit-cards";
import Hero from "@/components/blocks/hero";
import Testimonials from "@/components/blocks/testimonials";
import StackedFeatureRows from "@/components/blocks/stacked-feature-rows";
import StackedTimeline from "@/components/blocks/stacked-timeline";
import {
  resolveSectionBoundaries,
} from "@/components/blocks/section-boundaries";
// page-builder-generator:component-imports
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
  testimonialDataAttribute?: (
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
  "testimonials",
  "stackedFeatureRows",
  "stackedTimeline",
  // page-builder-generator:editing-types
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
  testimonials: Testimonials,
  stackedFeatureRows: StackedFeatureRows,
  stackedTimeline: StackedTimeline,
  // page-builder-generator:component-map
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
  const visibleSections = blocks.flatMap((block) => {
    if (!componentMap[block._type] || !isRenderableBlock(block)) return [];
    return [
      {
        key: block._key,
        theme: "theme" in block ? (block.theme as string | null) : null,
        kind: block._type === "hero" ? ("hero" as const) : ("content" as const),
        edgeTreatment:
          block._type === "ctaBanner" ? ("wave" as const) : ("none" as const),
      },
    ];
  });
  const resolvedBoundaries = resolveSectionBoundaries(visibleSections);

  return (
    <>
      {blocks?.map((block) => {
        const Component = componentMap[block._type] as
          React.ComponentType<Block & BlockEditingProps> | undefined;
        if (!Component) return null;

        const blockPath = `blocks[_key=="${block._key}"]`;
        const dataSanity = stega
          ? createDataAttribute({
              baseUrl:
                process.env.NEXT_PUBLIC_STUDIO_URL || "http://localhost:3333",
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
                baseUrl:
                  process.env.NEXT_PUBLIC_STUDIO_URL || "http://localhost:3333",
                dataset,
                id: documentId,
                path: `${blockPath}.${path}`,
                projectId,
                type: documentType,
              }).toString()
          : undefined;
        const editingProps: BlockEditingProps =
          block._type === "teamMembers" || block._type === "testimonials"
            ? {
                dataAttribute,
                [block._type === "teamMembers"
                  ? "memberDataAttribute"
                  : "testimonialDataAttribute"]: stega
                  ? (memberId: string, path: string) =>
                      createDataAttribute({
                        baseUrl:
                          process.env.NEXT_PUBLIC_STUDIO_URL ||
                          "http://localhost:3333",
                        dataset,
                        id: memberId,
                        path,
                        projectId,
                        type:
                          block._type === "teamMembers"
                            ? "teamMember"
                            : "testimonial",
                      }).toString()
                  : undefined,
              }
            : serverFieldEditingBlockTypes.has(block._type)
              ? { dataAttribute }
            : {};
        const boundary = resolvedBoundaries.find(({ key }) => key === block._key);

        return (
          <div data-sanity={dataSanity} key={block._key}>
            <Component {...block} {...editingProps} {...boundary} />
          </div>
        );
      })}
    </>
  );
}

function isRenderableBlock(block: Block) {
  if (block._type === "richTextBlock") {
    return Boolean(
      stegaClean(block.eyebrow)?.trim() ||
        stegaClean(block.title)?.trim() ||
        block.richText?.length,
    );
  }
  if (block._type === "ctaBanner" || block._type === "hero") {
    return Boolean(stegaClean(block.title)?.trim());
  }
  if (block._type === "benefitCards") return Boolean(block.cards?.length);
  if (block._type === "stackedFeatureRows") return Boolean(block.rows?.length);
  if (block._type === "latestArticles") return Boolean(block.articles?.length);
  if (block._type === "faqAccordion") return Boolean(block.faqs?.length);
  if (block._type === "teamMembers") {
    return Boolean(block.members?.some((member) => member.document));
  }
  if (block._type === "testimonials") {
    return Boolean(block.testimonials?.some((item) => item.document?.body?.length));
  }
  if (block._type === "stackedTimeline") {
    return Boolean(
      block.items?.some(
        (item) => stegaClean(item.title)?.trim() && stegaClean(item.text)?.trim(),
      ),
    );
  }
  return true;
}
