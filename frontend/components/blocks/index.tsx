import { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { type LivePerspective } from "next-sanity/live";
import { createDataAttribute } from "next-sanity";
import HomeHero from "@/components/blocks/home-hero";
import LoanFeatureCards from "@/components/blocks/loan-feature-cards";
import VideoFeature from "@/components/blocks/video-feature";
import PhxEmbedSocialReviews from "@/components/blocks/phx-embed-social-reviews";
import HomebotWidget from "@/components/blocks/homebot-widget";
import LatestArticles from "@/components/blocks/latest-articles";
import FaqAccordion from "@/components/blocks/faq-accordion";
import AwardCta from "@/components/blocks/award-cta";
import PageHeader from "@/components/blocks/page-header";
import StoryFeature from "@/components/blocks/story-feature";
import BigVideoFeature, {
  type BigVideoDataAttributes,
} from "@/components/blocks/big-video-feature";
import EditorialChapter from "@/components/blocks/editorial-chapter";
import YoutubeChannelFeature from "@/components/blocks/youtube-channel-feature";
import PersonCta from "@/components/blocks/person-cta";
import LocationMap from "@/components/blocks/location-map";
import PersonContactCta from "@/components/blocks/person-contact-cta";
import ContactForm from "@/components/blocks/contact-form";
import TeamMembers from "@/components/blocks/team-members";
import RichTextBlock from "@/components/blocks/rich-text-block";
import AdvisorCta from "@/components/blocks/advisor-cta";
import ProcessSteps from "@/components/blocks/process-steps";
import CtaBanner from "@/components/blocks/cta-banner";
import BenefitCards from "@/components/blocks/benefit-cards";
import ComparisonTable from "@/components/blocks/comparison-table";
import LoanRequirements from "@/components/blocks/loan-requirements";
import { dataset, projectId } from "@/sanity/lib/env";

type Block =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type BlockEditingProps = {
  dataAttribute?: (path: string) => string | undefined;
  dataAttributes?: BigVideoDataAttributes;
  memberDataAttribute?: (
    documentId: string,
    path: string,
  ) => string | undefined;
};

const serverFieldEditingBlockTypes = new Set<Block["_type"]>([
  "faqAccordion",
  "pageHeader",
  "storyFeature",
  "editorialChapter",
  "youtubeChannelFeature",
  "personCta",
  "locationMap",
  "personContactCta",
  "contactForm",
  "teamMembers",
  "richTextBlock",
  "homebotWidget",
  "advisorCta",
  "processSteps",
  "ctaBanner",
  "benefitCards",
  "comparisonTable",
  "loanRequirements",
]);

const componentMap: Partial<{
  [K in Block["_type"]]: React.ComponentType<
    Extract<Block, { _type: K }> & BlockEditingProps
  >;
}> = {
  homeHero: HomeHero,
  loanFeatureCards: LoanFeatureCards,
  videoFeature: VideoFeature,
  phxEmbedSocialReviews: PhxEmbedSocialReviews,
  homebotWidget: HomebotWidget,
  latestArticles: LatestArticles,
  faqAccordion: FaqAccordion,
  awardCta: AwardCta,
  pageHeader: PageHeader,
  storyFeature: StoryFeature,
  bigVideoFeature: BigVideoFeature,
  editorialChapter: EditorialChapter,
  youtubeChannelFeature: YoutubeChannelFeature,
  personCta: PersonCta,
  locationMap: LocationMap,
  personContactCta: PersonContactCta,
  contactForm: ContactForm,
  teamMembers: TeamMembers,
  richTextBlock: RichTextBlock,
  advisorCta: AdvisorCta,
  processSteps: ProcessSteps,
  ctaBanner: CtaBanner,
  benefitCards: BenefitCards,
  comparisonTable: ComparisonTable,
  loanRequirements: LoanRequirements,
};

export default function Blocks({
  anchorIds,
  blocks,
  documentId,
  documentType = "page",
  stega,
}: {
  anchorIds?: Record<string, string>;
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
          block._type === "bigVideoFeature"
            ? {
                dataAttributes: dataAttribute
                  ? {
                      description: dataAttribute("description"),
                      eyebrow: dataAttribute("eyebrow"),
                      thumbnailImage: dataAttribute("thumbnailImage"),
                      title: dataAttribute("title"),
                      youtubeUrl: dataAttribute("youtubeUrl"),
                    }
                  : undefined,
              }
            : block._type === "teamMembers"
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

        const anchorId = anchorIds?.[block._key];
        // Reserve both bars because an upward anchor jump reveals the site
        // header after the browser calculates the target offset.
        const anchorClassName = anchorId
          ? "scroll-mt-[calc(var(--header-height)+3.5rem)]"
          : undefined;

        return (
          <div
            className={anchorClassName}
            data-sanity={dataSanity}
            id={anchorId}
            key={block._key}
          >
            <Component {...block} {...editingProps} />
          </div>
        );
      })}
    </>
  );
}
