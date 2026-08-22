import { describe, expect, it } from "vitest";
import { createQuickNavModel, type QuickNavSourceBlock } from "./quick-nav";

function block(
  key: string,
  type: QuickNavSourceBlock["_type"],
  sectionNav: { navLabel: string | null } | null = null,
) {
  return { _key: key, _type: type, sectionNav };
}

describe("createQuickNavModel", () => {
  it("includes only sections with nonblank labels", () => {
    const model = createQuickNavModel(
      [
        block("a", "richTextBlock", { navLabel: "What it means" }),
        block("b", "processSteps", { navLabel: "How it works" }),
        block("c", "benefitCards", { navLabel: "  " }),
        block("d", "faqAccordion"),
      ],
      true,
    );

    expect(model.items.map((item) => item.id)).toEqual([
      "what-it-means",
      "how-it-works",
    ]);
    expect(model.showQuickNav).toBe(true);
    expect(model.anchorIdByKey).toEqual({
      a: "what-it-means",
      b: "how-it-works",
    });
  });

  it("hides the nav for fewer than two items or when disabled", () => {
    const single = createQuickNavModel(
      [block("a", "richTextBlock", { navLabel: "Only one" })],
      true,
    );
    expect(single.showQuickNav).toBe(false);
    expect(single.anchorIdByKey).toEqual({ a: "only-one" });

    const disabled = createQuickNavModel(
      [
        block("a", "richTextBlock", { navLabel: "One" }),
        block("b", "processSteps", { navLabel: "Two" }),
      ],
      false,
    );
    expect(disabled.showQuickNav).toBe(false);
  });

  it("dedupes anchor ids for duplicate labels", () => {
    const model = createQuickNavModel(
      [
        block("a", "richTextBlock", { navLabel: "Options" }),
        block("b", "benefitCards", { navLabel: "Options" }),
      ],
      true,
    );
    expect(model.items.map((item) => item.id)).toEqual(["options", "options-2"]);
  });

  it("counts the leading hero blocks so the nav slots in below them", () => {
    const model = createQuickNavModel(
      [
        block("hero", "pageHeader"),
        block("a", "richTextBlock", { navLabel: "One" }),
        block("b", "processSteps", { navLabel: "Two" }),
      ],
      true,
    );
    expect(model.heroCount).toBe(1);
  });
});
