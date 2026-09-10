// Shadcnblocks faq1. h2 preserves the page heading hierarchy.
import { simpleRichTextComponents } from "@/components/simple-rich-text";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { PortableText } from "@portabletext/react";
import { stegaClean } from "next-sanity";
type Props = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "faqAccordion" }
> & { dataAttribute?: (path: string) => string | undefined };
export default function FaqAccordion({
  _key,
  title,
  faqs,
  dataAttribute,
}: Props) {
  const visible = (faqs ?? []).filter((f) => stegaClean(f.title)?.trim());
  if (!visible.length) return null;
  return (
    <section
      className="py-32"
      id={`faq-${stegaClean(_key)}`}
      aria-labelledby={`faq-accordion-${stegaClean(_key)}`}
    >
      <div className="container">
        <div className="mx-auto max-w-3xl">
          <h2
            className="mb-4 text-3xl font-semibold md:mb-11 md:text-4xl"
            id={`faq-accordion-${stegaClean(_key)}`}
            data-sanity={dataAttribute?.("title")}
          >
            {title}
          </h2>
          <Accordion
            type="single"
            collapsible
            data-sanity={dataAttribute?.("faqs")}
          >
            {visible.map((f) => (
              <AccordionItem key={f._key || f._id} value={f._key || f._id}>
                <AccordionTrigger className="font-semibold hover:no-underline">
                  {f.title}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <PortableText
                    components={simpleRichTextComponents}
                    value={f.answer ?? []}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
