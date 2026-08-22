import Link from "next/link";
import type { ReactNode } from "react";
import type { FooterLinkModel } from "./model";

const baseClassName =
  "break-words typo-body-sm text-white/80 transition-colors motion-fast [overflow-wrap:anywhere] hover:text-white focus-ring-on-dark";

export function FooterLink({
  children,
  className = "",
  dataSanity,
  link,
}: {
  children?: ReactNode;
  className?: string;
  dataSanity?: string;
  link: FooterLinkModel;
}) {
  return (
    <Link
      className={`${baseClassName} ${className}`}
      data-sanity={dataSanity}
      href={link.href}
      prefetch={false}
      rel={link.openInNewTab ? "noopener noreferrer" : undefined}
      target={link.openInNewTab ? "_blank" : undefined}
    >
      {children ?? link.label}
    </Link>
  );
}
