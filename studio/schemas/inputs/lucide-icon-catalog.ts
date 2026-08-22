import { lucideIconNames } from "./lucide-icon-names";
import {
  isLoanIconName,
  type LoanIconName,
} from "../../../shared/loan-icons";

export type CanonicalLucideIconName = (typeof lucideIconNames)[number];
export type NavigationIconName = CanonicalLucideIconName | LoanIconName;

export const canonicalLucideIconNames = lucideIconNames;

const canonicalLucideIconNameSet = new Set<string>(canonicalLucideIconNames);

export function isCanonicalLucideIconName(
  value: unknown,
): value is CanonicalLucideIconName {
  return typeof value === "string" && canonicalLucideIconNameSet.has(value);
}

export function isNavigationIconName(value: unknown): value is NavigationIconName {
  return isLoanIconName(value) || isCanonicalLucideIconName(value);
}
