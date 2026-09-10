import type { PortableTextProps } from "@portabletext/react";
import { CustomLinkMarkRenderer } from "@/components/portable-text/custom-link-mark";

// Inline content for the description slots in Shadcnblocks sections.
export const simpleRichTextComponents: PortableTextProps["components"] = {
  block: {
    normal: ({ children }) => <p>{children}</p>,
  },
  marks: {
    customLink: CustomLinkMarkRenderer,
  },
};
