import { defineField } from "sanity";

export const generalPageBuilderBlockTypes = [
  "hero",
  "richTextBlock",
  "benefitCards",
  "storyFeature",
  "latestArticles",
  "faqAccordion",
  "teamMembers",
  "ctaBanner",
] as const;

export const contentPageBuilderBlockTypes = [
  "richTextBlock",
  "benefitCards",
  "storyFeature",
  "latestArticles",
  "faqAccordion",
  "teamMembers",
  "ctaBanner",
] as const;

export const pageBuilderBlockTypes = generalPageBuilderBlockTypes;
export const homePagePageBuilderBlockTypes = generalPageBuilderBlockTypes;

type PageBuilderBlockType = (typeof generalPageBuilderBlockTypes)[number];

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
  const faqCount =
    blocks?.filter((block) => block?._type === "faqAccordion").length ?? 0;
  if (faqCount > 1) return "Add no more than one FAQ section";
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
    of: blockTypes.map((type) => ({ type })),
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
export const contentBlocksField = createBlocksField(
  contentPageBuilderBlockTypes,
);
export const homePageBlocksField = createBlocksField(
  homePagePageBuilderBlockTypes,
);
