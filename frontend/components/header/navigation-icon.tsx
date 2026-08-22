import { cn } from "@/lib/utils";
import { isLoanIconName } from "../../../shared/loan-icons";
import { LoanIcon } from "../icons/loan-icon";
import { isSafeIconSvg } from "./safe-icon-svg";

export type NavigationIconModel = {
  name: string;
  /** Lucide artwork captured by the Studio picker; loan icons ship with the app. */
  svg: string | null;
};

/**
 * Renders the SVG markup stored in Sanity instead of importing from
 * lucide-react: bundling any dynamic Lucide lookup forces the dev server to
 * compile ~2,000 icon modules into both the server and client graphs.
 */
export function NavigationIcon({
  className,
  icon,
}: {
  className?: string;
  icon: NavigationIconModel;
}) {
  if (isLoanIconName(icon.name)) {
    return <LoanIcon className={cn("size-4", className)} name={icon.name} />;
  }
  if (!icon.svg || !isSafeIconSvg(icon.svg)) return null;

  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-4 *:size-full", className)}
      dangerouslySetInnerHTML={{ __html: icon.svg }}
    />
  );
}
