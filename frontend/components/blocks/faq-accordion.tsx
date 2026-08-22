import { simpleRichTextComponents } from "@/components/simple-rich-text";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { PortableText } from "@portabletext/react";
import { ArrowUpRight, Plus } from "lucide-react";
import { stegaClean } from "next-sanity";
import Link from "next/link";

type FaqAccordionProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "faqAccordion" }
> & {
  dataAttribute?: (path: string) => string | undefined;
};

export default function FaqAccordion({
  _key,
  dataAttribute,
  eyebrow,
  faqs,
  link,
  subtitle,
  title,
  useCreamBackground,
}: FaqAccordionProps) {
  const visibleFaqs = faqs?.filter((faq) => stegaClean(faq.title)?.trim()) ?? [];
  const defaultValue = visibleFaqs[0]?._key || visibleFaqs[0]?._id || undefined;
  const href = stegaClean(link?.href);
  const displayEyebrow = stegaClean(eyebrow)?.trim();
  const displaySubtitle = stegaClean(subtitle)?.trim();
  const displayTitle = stegaClean(title)?.trim();
  const headingId = `faq-accordion-${stegaClean(_key)}`;
  const sectionId = `faq-${stegaClean(_key)}`;

  return (
    <section
      aria-labelledby={displayTitle ? headingId : undefined}
      className={cn(
        "scroll-mt-24 section-pad",
        stegaClean(useCreamBackground) ? "surface-cream" : "surface-white",
      )}
      data-sanity={dataAttribute?.("useCreamBackground")}
      id={sectionId}
    >
      <div className="container">
        <div className="mx-auto max-w-3xl">
          <header className="text-center section-header-gap">
            {displayEyebrow ? (
              <p
                className="mb-3.5 typo-eyebrow text-primary"
                data-sanity={dataAttribute?.("eyebrow")}
              >
                {displayEyebrow}
              </p>
            ) : null}
            {displayTitle ? (
              <h2
                className="text-balance typo-section-heading text-foreground"
                data-sanity={dataAttribute?.("title")}
                id={headingId}
              >
                {displayTitle}
              </h2>
            ) : null}
            {displaySubtitle ? (
              <p
                className="mx-auto mt-5 max-w-2xl text-balance typo-lead text-muted-foreground"
                data-sanity={dataAttribute?.("subtitle")}
              >
                {displaySubtitle}
              </p>
            ) : null}
          </header>

          {visibleFaqs.length ? (
            <Accordion
              className="w-full border-t border-border"
              collapsible
              data-sanity={dataAttribute?.("faqs")}
              defaultValue={defaultValue}
              type="single"
            >
              {visibleFaqs.map((faq) => {
                const value = faq._key || faq._id;

                return (
                  <AccordionItem
                    className="border-border last:border-b"
                    key={value}
                    value={value}
                  >
                    <AccordionTrigger className="group items-center py-6 typo-title-minor hover:no-underline [&>svg]:hidden">
                      <span>{faq.title}</span>
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border-strong bg-card text-foreground transition-transform motion-fast group-data-[state=open]:rotate-45">
                        <Plus aria-hidden="true" className="size-4" strokeWidth={1.5} />
                      </span>
                    </AccordionTrigger>
                    {faq.answer?.length ? (
                      <AccordionContent className="pb-6 text-muted-foreground">
                        <div className="max-w-3xl typo-body">
                          <PortableText
                            components={simpleRichTextComponents}
                            value={faq.answer}
                          />
                        </div>
                      </AccordionContent>
                    ) : null}
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : null}

          {href && (link?.description || link?.title) ? (
            <div className="w-full py-6" data-sanity={dataAttribute?.("link")}>
              {link.title ? (
                <p className="mb-1 typo-fine-print">
                  {link.title}
                </p>
              ) : null}
              <Link
                aria-label={
                  stegaClean(link.description) || stegaClean(link.title) || "Learn more"
                }
                className="flex items-center gap-2"
                href={href}
                rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                target={link.openInNewTab ? "_blank" : undefined}
              >
                {link.description ? (
                  <p className="typo-button">
                    {link.description}
                  </p>
                ) : null}
                <span className="rounded-full border p-1">
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-4 text-muted-foreground"
                  />
                </span>
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
