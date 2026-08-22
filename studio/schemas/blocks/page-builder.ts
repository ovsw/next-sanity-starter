import { defineField } from "sanity";
import { singleFaqBlock } from "../validation/single-faq-block.ts";

export const generalPageBuilderBlockTypes = [
  "loanFeatureCards",
  "videoFeature",
  "phxEmbedSocialReviews",
  "homebotWidget",
  "latestArticles",
  "faqAccordion",
  "awardCta",
  "pageHeader",
  "storyFeature",
  "bigVideoFeature",
  "editorialChapter",
  "youtubeChannelFeature",
  "personCta",
  "locationMap",
  "personContactCta",
  "contactForm",
  "teamMembers",
  "richTextBlock",
  "advisorCta",
  "processSteps",
  "ctaBanner",
  "benefitCards",
  "comparisonTable",
  "loanRequirements",
] as const;

// Retain the established export for existing consumers of the general inventory.
export const pageBuilderBlockTypes = generalPageBuilderBlockTypes;

const heroBlockTypes = ["homeHero", "pageHeader"] as const;
export const homePagePageBuilderBlockTypes = [
  "homeHero",
  ...generalPageBuilderBlockTypes,
] as const;

type PageBuilderBlockType = (typeof homePagePageBuilderBlockTypes)[number];

function createBlocksField(blockTypes: readonly PageBuilderBlockType[]) {
  const heroTypes = blockTypes.filter((type) =>
    heroBlockTypes.includes(type as (typeof heroBlockTypes)[number]),
  );
  const contentTypes = blockTypes.filter(
    (type) => !heroBlockTypes.includes(type as (typeof heroBlockTypes)[number]),
  );

  return defineField({
    name: "blocks",
    type: "array",
    group: "content",
    of: blockTypes.map((type) => ({ type })),
    validation: (rule) => rule.custom(singleFaqBlock),
    options: {
      insertMenu: {
        groups: [
          { name: "hero", title: "Hero", of: heroTypes },
          { name: "content", title: "Content", of: contentTypes },
        ],
        views: [
          {
            name: "grid",
            previewImageUrl: (block: string) =>
              `/static/images/preview/${block}.jpg`,
          },
          { name: "list" },
        ],
      },
    },
  });
}

export const blocksField = createBlocksField(generalPageBuilderBlockTypes);
export const homePageBlocksField = createBlocksField(
  homePagePageBuilderBlockTypes,
);
