import { createElement, type ReactNode } from "react";
import { getLoanIcon } from "../../../shared/loan-icons";

export function LoanIcon({
  className,
  fallback = null,
  name,
  size = 20,
}: Readonly<{
  className?: string;
  fallback?: ReactNode;
  name?: string | null;
  size?: number;
}>) {
  const icon = getLoanIcon(name);
  if (!icon) return fallback;

  return (
    <svg
      aria-hidden="true"
      className={className}
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
