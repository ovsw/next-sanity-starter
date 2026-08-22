import { BadgeDollarSign } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

const loanIconOptions = [
  { title: "Conventional Loan", value: "conventional-loan" },
  { title: "FHA Loan", value: "fha-loan" },
  { title: "American Flag", value: "american-flag" },
  { title: "Adjustable Rate Mortgage", value: "adjustable-rate-mortgage" },
  { title: "Elephant", value: "elephant" },
];

type HelpCardValue = {
  title?: string;
  body?: string;
  ctaLabel?: string;
  ctaLink?: { type?: string; external?: string; internal?: unknown };
};

const helpCardRequiredFields: ReadonlyArray<[keyof HelpCardValue, string]> = [
  ["title", "a heading"],
  ["body", "body copy"],
  ["ctaLabel", "a button label"],
  ["ctaLink", "a button link"],
];

export function validateHelpCard(
  value: HelpCardValue | undefined,
  showHelpCard: boolean | undefined,
): true | string {
  // An absent toggle means a legacy document, where the card still renders.
  if (showHelpCard === false) return true;

  const missing = helpCardRequiredFields
    .filter(([field]) => {
      const fieldValue = value?.[field];
      if (typeof fieldValue === "string") return !fieldValue.trim();
      return !fieldValue;
    })
    .map(([, label]) => label);

  if (!missing.length) return true;
  return `The help card needs ${missing.join(", ")}. Turn off "Show Help Card" if you do not want it.`;
}

const loanFeatureCard = defineArrayMember({
  name: "phxLoanFeatureCard",
  type: "object",
  fields: [
    defineField({
      name: "title",
      type: "string",
      description: "The loan card heading visitors will see",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "icon",
      title: "Icon",
      type: "string",
      description: "Choose the mortgage loan icon that should appear on this card",
      options: { list: loanIconOptions },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "bullets",
      type: "array",
      description: "Short supporting points for this loan option",
      of: [defineArrayMember({ type: "string" })],
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: "link",
      title: "Link",
      type: "customUrl",
      description: "The page visitors should open to learn about this loan",
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "icon" },
    prepare: ({ title, subtitle }) => ({
      title: title || "Untitled Loan Card",
      subtitle: subtitle || "Loan card",
    }),
  },
});

export default defineType({
  name: "loanFeatureCards",
  title: "Loan Feature Cards",
  type: "object",
  icon: BadgeDollarSign,
  description: "Mortgage loan feature cards with a controlled set of industry-specific icons",
  fields: [
    defineField({
      name: "useCreamBackground",
      title: "Use Cream Background",
      type: "boolean",
      description: "Turn on to use a cream background for this section. Leave off for white.",
      initialValue: false,
    }),
    defineField({
      name: "eyebrow",
      type: "string",
      description: "Optional text shown above the section title",
    }),
    defineField({
      name: "title",
      type: "string",
      description: "The main heading for the loan cards section",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "intro",
      type: "text",
      rows: 3,
      description: "Optional paragraph shown beside the section heading",
    }),
    defineField({
      name: "cards",
      type: "array",
      description: "The loan options to feature on the homepage",
      of: [loanFeatureCard],
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: "showHelpCard",
      title: "Show Help Card",
      type: "boolean",
      description:
        "Turn on to show the highlighted help card after the loan cards. Useful for filling the grid when the loan count is uneven.",
      initialValue: true,
    }),
    defineField({
      name: "helpCard",
      title: "Help Card",
      type: "object",
      description: "The highlighted card shown after the loan cards",
      hidden: ({ parent }) => parent?.showHelpCard === false,
      fields: [
        defineField({
          name: "title",
          type: "string",
          description: "The help card heading",
        }),
        defineField({
          name: "body",
          type: "text",
          rows: 3,
          description: "Short supporting copy shown under the heading",
        }),
        defineField({
          name: "ctaLabel",
          title: "Button Label",
          type: "string",
          description: "The text shown on the help card button",
        }),
        defineField({
          name: "ctaLink",
          title: "Button Link",
          type: "customUrl",
          description: "Where the help card button should take visitors",
        }),
      ],
      validation: (rule) =>
        rule.custom((value, context) => {
          const block = context.parent as { showHelpCard?: boolean } | undefined;
          return validateHelpCard(value as HelpCardValue | undefined, block?.showHelpCard);
        }),
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Untitled Loan Feature Cards",
      subtitle: "Loan Feature Cards",
    }),
  },
});
