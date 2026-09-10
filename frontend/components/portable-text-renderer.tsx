import { PortableText, type PortableTextProps } from "@portabletext/react";
import { simpleRichTextComponents } from "@/components/simple-rich-text";
// Section blocks own their source spacing; prose must not add inline margins.
export default function PortableTextRenderer({
  value,
}: {
  value: PortableTextProps["value"];
}) {
  return <PortableText components={simpleRichTextComponents} value={value} />;
}
