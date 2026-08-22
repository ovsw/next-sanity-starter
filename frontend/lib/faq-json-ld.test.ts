import { describe, expect, it } from "vitest";
import {
  createFaqPageJsonLd,
  serializeFaqPageJsonLd,
  type FaqJsonLdBlock,
} from "./faq-json-ld";

type FaqBlock = Extract<FaqJsonLdBlock, { _type: "faqAccordion" }>;
type Faq = NonNullable<FaqBlock["faqs"]>[number];

function faq(id: string, title: string | null, answer: string | null): Faq {
  return {
    _id: id,
    _key: `key-${id}`,
    _type: "faq",
    title,
    answer:
      answer === null
        ? null
        : [
            {
              _key: `answer-${id}`,
              _type: "block",
              children: [
                {
                  _key: `span-${id}`,
                  _type: "span",
                  marks: [],
                  text: answer,
                },
              ],
              markDefs: [],
              style: "normal",
            },
          ],
  };
}

function faqBlock(faqs: Faq[]): FaqBlock {
  return { _type: "faqAccordion", faqs };
}

describe("createFaqPageJsonLd", () => {
  it("builds an FAQPage from usable Q&As", () => {
    expect(
      createFaqPageJsonLd([
        faqBlock([
          faq("faq-1", "  What is onboarding?  ", "  A setup review.  "),
        ]),
      ]),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
            name: "What is onboarding?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A setup review.",
            },
        },
      ],
    });
  });

  it("merges FAQs from multiple blocks into one entity", () => {
    const result = createFaqPageJsonLd([
      faqBlock([faq("faq-1", "First?", "First answer.")]),
      faqBlock([faq("faq-2", "Second?", "Second answer.")]),
    ]);

    expect(result?.mainEntity.map(({ name }) => name)).toEqual([
      "First?",
      "Second?",
    ]);
  });

  it("strips stega characters from titles and answers", () => {
    const stega = "\u200b\u200c\u200d\ufeff";
    const result = createFaqPageJsonLd([
      faqBlock([
        faq("faq-1", `Question?${stega}`, `Answer.${stega}`),
      ]),
    ]);

    expect(result?.mainEntity[0]).toMatchObject({
      name: "Question?",
      acceptedAnswer: { text: "Answer." },
    });
  });

  it("dedupes repeated FAQ documents by id", () => {
    const duplicate = faq("faq-1", "Repeated?", "Only once.");
    const result = createFaqPageJsonLd([
      faqBlock([duplicate]),
      faqBlock([duplicate]),
    ]);

    expect(result?.mainEntity).toHaveLength(1);
  });

  it("excludes title-only FAQs", () => {
    const result = createFaqPageJsonLd([
      faqBlock([
        faq("title-only", "Visible title", null),
        faq("usable", "Usable title", "Usable answer"),
      ]),
    ]);

    expect(result?.mainEntity.map(({ name }) => name)).toEqual([
      "Usable title",
    ]);
  });

  it("returns null when there are no usable Q&As", () => {
    expect(
      createFaqPageJsonLd([
        { _type: "richTextBlock" },
        faqBlock([
          faq("missing-title", "  ", "Answer"),
          faq("missing-answer", "Question", "  "),
        ]),
      ]),
    ).toBeNull();
  });

  it("neutralizes script-closing payloads when serialized", () => {
    const value = createFaqPageJsonLd([
      faqBlock([
        faq("unsafe", "Unsafe?", "</script><script>alert(1)</script>"),
      ]),
    ]);

    expect(value).not.toBeNull();
    if (!value) return;

    const serialized = serializeFaqPageJsonLd(value);
    expect(serialized).not.toContain("<");
    expect(serialized).toContain("\\u003c/script>");
    expect(JSON.parse(serialized)).toEqual(value);
  });
});
