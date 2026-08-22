import { getSafeLinkHref } from "@/lib/safe-href";
import type { PortableTextMarkComponent } from "@portabletext/react";
import { stegaClean } from "next-sanity";
import Link from "next/link";

type CustomLinkMark = {
  _type: "customLink";
  href?: string | null;
  openInNewTab?: boolean | null;
};

/** Shared rendering and safety rules for every inline Portable Text link. */
export const CustomLinkMarkRenderer: PortableTextMarkComponent<CustomLinkMark> = ({
  children,
  value,
}) => {
  const href = getSafeLinkHref(value?.href);
  if (!href) return <span>{children}</span>;

  const openInNewTab = stegaClean(value?.openInNewTab) === true;

  return (
    <Link
      className="font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary"
      href={href}
      rel={openInNewTab ? "noopener noreferrer" : undefined}
      target={openInNewTab ? "_blank" : undefined}
    >
      {children}
    </Link>
  );
};
