import { createElement } from "react";
import { getLoanIcon } from "../../../shared/loan-icons";

export function LoanIcon({ name, size = 20 }: { name: string; size?: number }) {
  const icon = getLoanIcon(name);
  if (!icon) return null;

  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      {icon.nodes.map(([element, attributes], index) =>
        createElement(element, { ...attributes, key: index }),
      )}
    </svg>
  );
}
