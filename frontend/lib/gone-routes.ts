export const HARD_CODED_GONE_ROUTE_PATHS = [
  "/home-office-ideas-that-will-inspire-you",
  "/staycation-ideas-your-family-will-enjoy",
  "/top-10-interior-design-trends-in-2020-to-freshen-up-your-home",
  "/phoenix-home-loan-payoff-vision-board",
  "/make-home-attractive-before-putting-on-market",
  "/virtual-showings-what-you-need-to-know",
  "/spring-2021-buyers-guide",
] as const;

const goneRoutes = new Set<string>(HARD_CODED_GONE_ROUTE_PATHS);

export function isGoneRoute(pathname: string) {
  const normalized = pathname === "/" ? pathname : pathname.replace(/\/+$/, "");
  return goneRoutes.has(normalized);
}
