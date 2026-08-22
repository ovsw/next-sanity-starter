import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import type { Patch } from "@sanity/client";
import { getCliClient } from "sanity/cli";

const API_VERSION = "2026-03-23";
const DEFAULT_DATASET = "development";
const ALLOWED_DATASETS = ["development", "production"];
const DOCUMENT_ID = "convenionalLoan";
const EXPECTED_SLUG = "/phoenix-conventional-loan";

// Jimmy portrait already in use by advisorCta on blogIndex, personCta on
// mystory, and personContactCta on contactMe. Production must hold the same
// asset before this script can be applied there.
const PORTRAIT_ASSET_REF = "image-b6f3a25737c58c82dd1931125c34f8577a1e60d8-960x806-png";

// Icon svg values are byte-for-byte what the Studio icon picker stores
// (renderToStaticMarkup of the lucide-react icon); the frontend only renders
// svg markup that passes its fail-closed allowlist.
const HOUSE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-house" aria-hidden="true"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>';
const SHIELD_CHECK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path><path d="m9 12 2 2 4-4"></path></svg>';
const PERCENT_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-percent" aria-hidden="true"><line x1="19" x2="5" y1="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>';

function paragraph(key: string, text: string) {
  return {
    _key: key,
    _type: "block",
    style: "normal",
    markDefs: [],
    children: [{ _key: `${key}-span`, _type: "span", marks: [], text }],
  };
}

function telButton(key: string) {
  return {
    _key: key,
    _type: "button",
    variant: "outline",
    text: "Call (480) 800-8387",
    url: {
      _type: "customUrl",
      type: "external",
      external: "tel:4808008387",
      openInNewTab: false,
    },
  };
}

function internalButton(key: string, variant: string, text: string, ref: string) {
  return {
    _key: key,
    _type: "button",
    variant,
    text,
    url: {
      _type: "customUrl",
      type: "internal",
      openInNewTab: false,
      internal: { _ref: ref, _type: "reference" },
    },
  };
}

// Figures fact-checked August 2026: conforming limit $832,750 (FHFA, 2026);
// down payments per Fannie Mae Eligibility Matrix / Standard 97 / HomeReady;
// seller concessions 3/6/9% by down payment (Selling Guide B3-4.1-02);
// credit 620 (B3-5.1-01); DTI 50% via DU (B3-6-02); PMI 80% request / 78%
// auto-termination (CFPB, Homeowners Protection Act); VA funding fee
// 1.25-3.3% (VA.gov, schedule effective April 2023).
export const CONVENTIONAL_LOAN_CONTENT = {
  showQuickNav: true,
  meta: {
    title: "Phoenix Conventional Mortgage Loan | Phoenix Mortgage Lenders",
    description:
      "We offer conventional mortgage loans for eligible homeowners in Phoenix. Learn more about types of conventional loans and see if it works for you.",
    noindex: false,
  },
  blocks: [
    {
      _key: "page-header-conventional",
      _type: "pageHeader",
      eyebrow: "Conventional Mortgage Loan",
      title: "The Conventional Mortgage Loan",
      description:
        "Although it asks for a higher credit score and a sizable down payment, a conventional mortgage loan may be the perfect way to finance your home — stable rates, real flexibility, and no government program fees.",
      statistics: [
        {
          _key: "stat-down",
          _type: "statistic",
          value: "3% down",
          description: "minimum for qualifying first-time buyers",
        },
        {
          _key: "stat-score",
          _type: "statistic",
          value: "620 score",
          description: "the credit score to aim for",
        },
        {
          _key: "stat-seller",
          _type: "statistic",
          value: "Up to 9%",
          description:
            "of the home's price the seller can pay toward closing costs, depending on your down payment",
        },
      ],
    },
    {
      _key: "chapter-what-they-are",
      _type: "editorialChapter",
      useCreamBackground: true,
      eyebrow: "The Basics",
      title: "What are conventional mortgage loans?",
      richText: [
        paragraph(
          "what-p1",
          "Conventional mortgage loans are part of a loan program unique to private lenders — banks, credit unions, and mortgage companies. Because no government agency controls them, no agency can charge fees on them either.",
        ),
        paragraph(
          "what-p2",
          "Most conventional mortgage loans have fixed rates that do not change during the life of the loan, although some are adjustable-rate mortgages. Many buyers are drawn to these loans because interest rates stay stable in the midst of unpredictable times.",
        ),
      ],
      supportingContent: [
        {
          _key: "seller-help-impact",
          _type: "impactStatement",
          statement: "$12,000",
          label: "in seller-paid closing costs on a $400,000 home with minimum down",
          description:
            "On a conventional loan, the seller can cover closing costs for you — up to 3% of the price when you put less than 10% down, 6% with at least 10% down, and 9% with 25% or more down. That's money that stays in your pocket at the closing table.",
        },
      ],
      sectionNav: { _type: "section-nav", navLabel: "What they are" },
    },
    {
      _key: "table-conforming",
      _type: "comparisonTable",
      useCreamBackground: false,
      eyebrow: "Two Categories",
      title: "What kinds of conventional mortgage loans are there?",
      intro:
        "While conventional mortgage loans are the same by nature, a few key differences set them apart. Fannie Mae and Freddie Mac set dollar limits on conventional loans — for 2026, the conforming loan limit is $832,750 for most of the continental United States. Where your loan falls relative to that limit determines its category.",
      tableLabel: "Conforming vs. non-conforming at a glance",
      table: {
        rows: [
          {
            _key: "row-header",
            _type: "tableRow",
            cells: ["Feature", "Within the limits|Conforming", "Beyond the limits|Non-Conforming"],
          },
          {
            _key: "row-size",
            _type: "tableRow",
            cells: [
              "Loan size",
              "Stays under the $832,750 limit",
              "Exceeds the Fannie Mae & Freddie Mac limits",
            ],
          },
          {
            _key: "row-terms",
            _type: "tableRow",
            cells: [
              "Terms",
              "Falls within Fannie Mae & Freddie Mac terms and conditions",
              "Set by the individual lender",
            ],
          },
          {
            _key: "row-best",
            _type: "tableRow",
            cells: [
              "Best for",
              "Most home buying situations",
              "Luxury homes that need greater loan capacity (jumbo loans)",
            ],
          },
          {
            _key: "row-example",
            _type: "tableRow",
            cells: ["Example", "A $600,000 loan on a Phoenix home", "A $900,000 jumbo loan"],
          },
        ],
      },
      sectionNav: { _type: "section-nav", navLabel: "Conforming vs. non-conforming" },
    },
    {
      _key: "benefit-cards-advantages",
      _type: "benefitCards",
      useCreamBackground: true,
      eyebrow: "Three Key Advantages",
      title: "What are the advantages of conventional mortgage loans?",
      intro:
        "Among the countless financing options available, conventional mortgage loans offer key advantages that make them a wise home loan decision.",
      cards: [
        {
          _key: "adv-second-home",
          _type: "phxBenefitCard",
          icon: { name: "house", svg: HOUSE_SVG },
          title: "They allow for a second home purchase",
          body: [
            paragraph(
              "adv-second-home-p",
              "Other programs such as VA Home Loans only allow the purchase of a primary residence. Conventional mortgage loans give you greater versatility — invest in a home to sell in the future, or buy a vacation home for your family.",
            ),
          ],
        },
        {
          _key: "adv-mi-choice",
          _type: "phxBenefitCard",
          icon: { name: "shield-check", svg: SHIELD_CHECK_SVG },
          title: "They give the choice of mortgage insurance",
          body: [
            paragraph(
              "adv-mi-choice-p",
              "While FHA loans require lifetime mortgage insurance, conventional home loan participants only need it temporarily. Once your balance reaches 80% of the home's original value, you can ask to drop PMI — and at 78%, it ends automatically.",
            ),
          ],
        },
        {
          _key: "adv-no-fees",
          _type: "phxBenefitCard",
          icon: { name: "percent", svg: PERCENT_SVG },
          title: "They stop additional program fees",
          body: [
            paragraph(
              "adv-no-fees-p",
              "Because private lenders lead conventional mortgage loans, home buyers are protected from hidden government fees. Government-sponsored programs apply funding fees instead — VA Home Loans, for example, carry a 1.25% to 3.3% funding fee.",
            ),
          ],
        },
      ],
      sectionNav: { _type: "section-nav", navLabel: "Advantages" },
    },
    {
      _key: "table-requirements",
      _type: "comparisonTable",
      useCreamBackground: false,
      eyebrow: "Eligibility",
      title: "What are conventional mortgage loan requirements?",
      intro:
        "Conventional mortgage loans carry incredible benefits for homebuyers but come with stricter requirements. To be eligible, you have to pay a certain down payment, keep a high enough credit score, and have a promising debt-to-income ratio.",
      tableLabel: "Minimum down payment by situation",
      table: {
        rows: [
          {
            _key: "row-header",
            _type: "tableRow",
            cells: ["Situation", "Minimum down payment"],
          },
          { _key: "row-first-time", _type: "tableRow", cells: ["First-time home buyers", "3%"] },
          {
            _key: "row-homeready",
            _type: "tableRow",
            cells: ["Income under 80% of your area's median (HomeReady)", "3%"],
          },
          {
            _key: "row-other",
            _type: "tableRow",
            cells: ["Other buyers, including adjustable-rate mortgages", "5%"],
          },
          { _key: "row-second-home", _type: "tableRow", cells: ["Buying a second home", "10%"] },
          { _key: "row-investment", _type: "tableRow", cells: ["Investment properties", "15%"] },
          { _key: "row-jumbo", _type: "tableRow", cells: ["Jumbo loans", "Typically 10–20%"] },
        ],
      },
      cardsLabel: "Also required",
      cards: [
        {
          _key: "req-credit",
          _type: "phxComparisonCard",
          eyebrow: "Credit score",
          title: "620 or higher",
          body: [
            paragraph(
              "req-credit-p",
              "Since interest rates run lower for conventional mortgage loans than VA loans, your credit score has to be higher to compensate.",
            ),
          ],
        },
        {
          _key: "req-dti",
          _type: "phxComparisonCard",
          eyebrow: "Debt-to-income",
          title: "Under 50%",
          body: [
            paragraph(
              "req-dti-p",
              "Unlike most misconceptions, you can still have debt and qualify — most lenders accept a debt-to-income ratio below 50%.",
            ),
          ],
        },
      ],
      sectionNav: { _type: "section-nav", navLabel: "Requirements" },
    },
    {
      _key: "cta-banner-fit",
      _type: "ctaBanner",
      title: "Not sure where you fit?",
      description:
        "Jimmy's team will map your down payment scenario in one honest conversation — no pressure, no obligation.",
      buttons: [
        internalButton("btn-consult", "default", "Schedule Consult", "contactMe"),
        telButton("btn-call"),
      ],
    },
    {
      _key: "advisor-cta-why-conventional",
      _type: "advisorCta",
      useCreamBackground: true,
      eyebrow: "Why Conventional",
      title: "Your conventional mortgage Phoenix lender",
      richText: [
        paragraph(
          "why-p1",
          "For those who can fund a sizable down payment and have a good credit score, conventional mortgage loans can be an excellent financing solution — suited for families who are ready to purchase their dream home. When simplified, conventional home loans are not as intimidating as they seem.",
        ),
        paragraph(
          "why-p2",
          "Luminate Bank works to simplify the home loan process so you can get to homeownership. We serve our clients and partner with them every step of the way. Give us a call, or visit our Phoenix office in person — we would be honored to assist you.",
        ),
      ],
      buttons: [
        internalButton("btn-apply", "default", "Start Your Application", "apply"),
        telButton("btn-call-advisor"),
      ],
      portraitImage: {
        _type: "image",
        alt: "Jimmy Vercellino, home loan advisor",
        asset: { _ref: PORTRAIT_ASSET_REF, _type: "reference" },
      },
      sectionNav: { _type: "section-nav", navLabel: "Why conventional" },
    },
    {
      _key: "award-cta-trust",
      _type: "awardCta",
      highlight: "TOP 1%",
      title: "Mortgage Loan Originators",
      description: "in the U.S., 2019 — according to Mortgage Executive Magazine",
      buttons: [internalButton("btn-award-consult", "secondary", "Schedule Consult", "contactMe")],
    },
  ],
};

type PageDocument = {
  _id: string;
  _rev: string;
  _type: string;
  blocks?: unknown[];
  meta?: unknown;
  showQuickNav?: unknown;
  slug?: { current?: unknown };
  [key: string]: unknown;
};

export function validatePageBeforeBuild(document: PageDocument | undefined): string | undefined {
  if (!document) return `Document ${DOCUMENT_ID} does not exist`;
  if (document._id !== DOCUMENT_ID || document._type !== "page") {
    return `Expected the published page document with ID ${DOCUMENT_ID}`;
  }
  if (!document._rev) return "The current revision is required";
  if (document.slug?.current !== EXPECTED_SLUG) {
    return `slug.current must be ${EXPECTED_SLUG}`;
  }
  return undefined;
}

export function buildConventionalLoanMutation(document: PageDocument) {
  const validationError = validatePageBeforeBuild(document);
  if (validationError) throw new Error(validationError);
  return {
    id: document._id,
    ifRevisionID: document._rev,
    set: CONVENTIONAL_LOAN_CONTENT,
  };
}

export function isAlreadyApplied(document: PageDocument) {
  return (
    isDeepStrictEqual(document.blocks, CONVENTIONAL_LOAN_CONTENT.blocks) &&
    isDeepStrictEqual(document.meta, CONVENTIONAL_LOAN_CONTENT.meta) &&
    document.showQuickNav === CONVENTIONAL_LOAN_CONTENT.showQuickNav
  );
}

function resolveDataset(): string {
  const flag = process.argv.find((arg) => arg.startsWith("--dataset="));
  const dataset = flag ? flag.slice("--dataset=".length) : DEFAULT_DATASET;
  if (!ALLOWED_DATASETS.includes(dataset)) {
    throw new Error(`Unknown dataset ${dataset}; use one of ${ALLOWED_DATASETS.join(", ")}`);
  }
  return dataset;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const dataset = resolveDataset();
  const client = getCliClient({
    apiVersion: API_VERSION,
    dataset,
    perspective: "raw",
  });
  if (client.config().dataset !== dataset) {
    throw new Error(`Refusing to run outside the ${dataset} dataset`);
  }

  const documents = await client.fetch<PageDocument[]>(
    `*[_id in [$id, "drafts." + $id]]`,
    { id: DOCUMENT_ID },
  );
  const draft = documents.find((doc: PageDocument) => doc._id === `drafts.${DOCUMENT_ID}`);
  if (draft) {
    throw new Error(
      `drafts.${DOCUMENT_ID} exists; publish or discard it in the Studio before running this script`,
    );
  }
  const published = documents.find((doc: PageDocument) => doc._id === DOCUMENT_ID);
  const mutation = buildConventionalLoanMutation(published as PageDocument);
  const alreadyApplied = isAlreadyApplied(published as PageDocument);

  console.log(
    JSON.stringify(
      {
        dataset,
        mode: apply ? "apply" : "dry-run",
        documentId: mutation.id,
        alreadyApplied,
        blocksCount: CONVENTIONAL_LOAN_CONTENT.blocks.length,
      },
      null,
      2,
    ),
  );
  if (!apply || alreadyApplied) return;

  await client
    .transaction()
    .patch(mutation.id, (patch: Patch) =>
      patch.ifRevisionId(mutation.ifRevisionID).set(mutation.set),
    )
    .commit({ visibility: "sync" });

  const after = await client.fetch<PageDocument>(`*[_id == $id][0]`, { id: DOCUMENT_ID });
  if (!isAlreadyApplied(after)) {
    throw new Error("Verification failed: the document does not match the target content");
  }

  console.log(
    JSON.stringify(
      { applied: 1, documentId: after._id, blocksCount: after.blocks?.length, verified: true },
      null,
      2,
    ),
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
