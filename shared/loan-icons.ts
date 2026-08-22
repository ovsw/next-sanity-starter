export type LoanIconNode = readonly [
  "circle" | "path",
  Readonly<Record<string, string | number>>,
];

export const loanIcons = [
  {
    title: "Loan Conventional",
    value: "loan-conventional",
    nodes: [
      ["path", { d: "M3 21h18" }],
      ["path", { d: "M4 21V9l8-5 8 5v12" }],
      ["path", { d: "M9 21v-6h6v6" }],
    ],
  },
  {
    title: "Loan FHA",
    value: "loan-fha",
    nodes: [
      ["circle", { cx: 8, cy: 14, r: 4 }],
      ["path", { d: "M10.8 11.2 20 2" }],
      ["path", { d: "m17 5 3 3" }],
      ["path", { d: "m14 8 3 3" }],
    ],
  },
  {
    title: "Loan VA",
    value: "loan-va",
    nodes: [
      ["path", { d: "M12 3 4 6v5c0 4.5 3.2 7.9 8 10 4.8-2.1 8-5.5 8-10V6l-8-3Z" }],
      ["path", { d: "m9 11 2 2 4-4" }],
    ],
  },
  {
    title: "Loan C2P",
    value: "loan-c2p",
    nodes: [
      ["path", { d: "M3 21h18" }],
      ["path", { d: "M5 21V8l7-4 7 4" }],
      ["path", { d: "M12 4V2" }],
      ["path", { d: "M9 21v-5h6v5" }],
      ["path", { d: "M8.5 11h7" }],
    ],
  },
  {
    title: "Loan Jumbo",
    value: "loan-jumbo",
    nodes: [
      ["path", { d: "M3 21h18" }],
      ["path", { d: "M5 21V6a2 2 0 0 1 2-2h5v17" }],
      ["path", { d: "M12 21V9h5a2 2 0 0 1 2 2v10" }],
      ["path", { d: "M8 8h1M8 12h1M8 16h1M15 13h1M15 17h1" }],
    ],
  },
] as const satisfies ReadonlyArray<{
  title: string;
  value: string;
  nodes: readonly LoanIconNode[];
}>;

export type LoanIconName = (typeof loanIcons)[number]["value"];

const loanIconByName = new Map<string, (typeof loanIcons)[number]>(
  loanIcons.map((icon) => [icon.value, icon]),
);

export function getLoanIcon(value: unknown) {
  return typeof value === "string" ? loanIconByName.get(value) : undefined;
}

export function isLoanIconName(value: unknown): value is LoanIconName {
  return Boolean(getLoanIcon(value));
}

const loanFeatureIconToLoanIcon = {
  "adjustable-rate-mortgage": "loan-c2p",
  "american-flag": "loan-va",
  "conventional-loan": "loan-conventional",
  elephant: "loan-jumbo",
  "fha-loan": "loan-fha",
} as const satisfies Record<string, LoanIconName>;

const loanFeatureIconByName = new Map<string, LoanIconName>(
  Object.entries(loanFeatureIconToLoanIcon),
);

export function getLoanFeatureIcon(value: unknown): LoanIconName | undefined {
  return typeof value === "string" ? loanFeatureIconByName.get(value) : undefined;
}

export function searchLoanIcons(query: string) {
  const normalizedQuery = query.trim().toLowerCase().replaceAll(" ", "-");
  if (!normalizedQuery) return loanIcons;

  return loanIcons.filter(
    ({ title, value }) =>
      value.includes(normalizedQuery) ||
      title.toLowerCase().replaceAll(" ", "-").includes(normalizedQuery),
  );
}
