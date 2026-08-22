function isFaqBlock(block: unknown) {
  return (
    typeof block === "object" &&
    block !== null &&
    "_type" in block &&
    block._type === "faqAccordion"
  );
}

export function singleFaqBlock(blocks: readonly unknown[] | undefined) {
  const faqBlockCount = blocks?.filter(isFaqBlock).length ?? 0;

  return faqBlockCount <= 1 || "Only one FAQ section per page.";
}
