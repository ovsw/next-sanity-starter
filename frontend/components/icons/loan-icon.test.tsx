import { render } from "@testing-library/react";
import { dynamicIconImports } from "lucide-react/dynamic.mjs";
import { describe, expect, it } from "vitest";
import {
  getLoanFeatureIcon,
  loanIcons,
  searchLoanIcons,
} from "../../../shared/loan-icons";
import { LoanIcon } from "./loan-icon";

describe("LoanIcon", () => {
  it("preserves every custom label, stored value, and SVG node", () => {
    expect(loanIcons).toEqual([
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
    ]);
    expect(loanIcons.every(({ value }) => !(value in dynamicIconImports))).toBe(true);
  });

  it("maps every legacy loan-card value to its custom icon", () => {
    expect(
      [
        "adjustable-rate-mortgage",
        "american-flag",
        "conventional-loan",
        "elephant",
        "fha-loan",
      ].map(getLoanFeatureIcon),
    ).toEqual(["loan-c2p", "loan-va", "loan-conventional", "loan-jumbo", "loan-fha"]);
  });

  it.each(loanIcons)("renders the declared SVG nodes for $value", ({ nodes, value }) => {
    const { container } = render(<LoanIcon name={value} />);

    expect(container.querySelectorAll("path, circle")).toHaveLength(nodes.length);
  });

  it("uses the requested fallback for an invalid name", () => {
    const { getByText } = render(<LoanIcon fallback={<span>Fallback</span>} name="unknown" />);

    expect(getByText("Fallback")).toBeInTheDocument();
  });

  it("searches custom icons by label and stored value", () => {
    expect(searchLoanIcons("Loan FHA").map(({ value }) => value)).toEqual(["loan-fha"]);
    expect(searchLoanIcons("jumbo").map(({ value }) => value)).toEqual(["loan-jumbo"]);
  });
});
