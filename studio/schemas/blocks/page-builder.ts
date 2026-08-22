import { defineField, type ArrayOfObjectsInputProps } from "sanity";

export const generalPageBuilderBlockTypes = [
  "hero",
  "richTextBlock",
  "ctaBanner",
] as const;

export const pageBuilderBlockTypes = generalPageBuilderBlockTypes;
export const homePagePageBuilderBlockTypes = generalPageBuilderBlockTypes;

type PageBuilderBlockType = (typeof generalPageBuilderBlockTypes)[number];

export const legacyBlockTypes = [
  "homeHero",
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
  "advisorCta",
  "processSteps",
  "benefitCards",
  "comparisonTable",
  "loanRequirements",
] as const;

const legacyBlockTypeNames = new Set<string>(legacyBlockTypes);

function PageBuilderInput(props: ArrayOfObjectsInputProps) {
  return props.renderDefault({
    ...props,
    schemaType: {
      ...props.schemaType,
      of: props.schemaType.of.filter(
        (member) => !legacyBlockTypeNames.has(member.name),
      ),
    },
  });
}

function validateBlocks(
  blocks: Array<{ _type?: string }> | undefined,
): true | string {
  const heroIndexes = (blocks ?? []).flatMap((block, index) =>
    block?._type === "hero" ? [index] : [],
  );
  if (heroIndexes.length > 1) return "Add no more than one Hero section";
  if (heroIndexes.length === 1 && heroIndexes[0] !== 0) {
    return "The Hero section must be the first section";
  }
  return true;
}

function createBlocksField(blockTypes: readonly PageBuilderBlockType[]) {
  const heroTypes = blockTypes.filter((type) => type === "hero");
  const contentTypes = blockTypes.filter((type) => type !== "hero");

  return defineField({
    name: "blocks",
    title: "Page sections",
    type: "array",
    group: "content",
    components: { input: PageBuilderInput },
    of: [
      ...blockTypes.map((type) => ({ type })),
      ...legacyBlockTypes.map((type) => ({ type, hidden: true })),
    ],
    validation: (rule) => rule.custom(validateBlocks),
    options: {
      insertMenu: {
        groups: [
          { name: "hero", title: "Hero", of: heroTypes },
          { name: "content", title: "Content", of: contentTypes },
        ],
        views: [{ name: "list" }],
      },
    },
  });
}

export const blocksField = createBlocksField(generalPageBuilderBlockTypes);
export const homePageBlocksField = createBlocksField(
  homePagePageBuilderBlockTypes,
);
