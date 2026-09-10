// Shadcnblocks footer1: identity row, grouped columns, legal links, copyright.
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import Link from "next/link";
import { FooterLink } from "./footer-link";
import type { FooterColumnModel, FooterLinkModel, FooterModel } from "./model";

function LinkList({ links }: { links: FooterLinkModel[] }) {
  return (
    <ul className="space-y-4 text-sm text-muted-foreground">
      {links.map((link) => (
        <li key={link.key}>
          <FooterLink link={link} />
        </li>
      ))}
    </ul>
  );
}

function FooterColumn({ column }: { column: FooterColumnModel }) {
  const headingId = `footer-column-${column.key}`;
  return (
    <section aria-labelledby={headingId}>
      <h2 className="mb-4 text-sm font-semibold tracking-tight" id={headingId}>
        {column.heading}
      </h2>
      <LinkList links={column.links} />
    </section>
  );
}

export function SiteFooter({
  dataAttribute,
  model,
}: {
  dataAttribute?: (path: string) => string | undefined;
  model: FooterModel;
}) {
  const hasContact = Boolean(
    model.contact.email ||
    model.contact.phone ||
    model.contact.addressLines.length,
  );

  return (
    <footer className="py-24 pb-16" data-footer-state="ready">
      <div className="container">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <Link
            className="text-lg font-semibold"
            aria-label={`${model.brand.label} home page`}
            href="/"
          >
            {model.brand.image ? (
              <Image
                className="h-7 w-auto"
                alt={model.brand.label}
                height={model.brand.image.height}
                src={model.brand.image.src}
                width={model.brand.image.width}
              />
            ) : (
              model.brand.label
            )}
          </Link>
          {model.intro ? (
            <p
              className="max-w-md text-sm text-muted-foreground"
              data-sanity={dataAttribute?.("intro")}
            >
              {model.intro}
            </p>
          ) : null}
        </div>
        <Separator className="my-8" />
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {model.columns.map((column) => (
            <FooterColumn column={column} key={column.key} />
          ))}
          {hasContact ? (
            <section
              className="space-y-4 text-sm text-muted-foreground"
              aria-labelledby="footer-contact"
            >
              <h2
                className="mb-4 text-sm font-semibold tracking-tight"
                id="footer-contact"
              >
                Contact
              </h2>
              {model.contact.email ? (
                <FooterLink link={model.contact.email} />
              ) : null}
              {model.contact.phone ? (
                <FooterLink link={model.contact.phone} />
              ) : null}
              {model.contact.addressLines.length ? (
                <address>
                  {model.contact.addressLines.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </address>
              ) : null}
            </section>
          ) : null}
          {model.socialLinks.length ? (
            <nav aria-label="Social links">
              <h2 className="mb-4 text-sm font-semibold">Social</h2>
              <LinkList links={model.socialLinks} />
            </nav>
          ) : null}
          {model.legalLinks.length ? (
            <nav aria-label="Legal links">
              <h2 className="mb-4 text-sm font-semibold">Legal</h2>
              <LinkList links={model.legalLinks} />
            </nav>
          ) : null}
        </div>
        <Separator className="my-8" />{" "}
        <p className="text-xs text-muted-foreground">
          ©{" "}
          <span data-sanity={dataAttribute?.("copyrightStartYear")}>
            {model.copyrightYears}
          </span>{" "}
          <span data-sanity={dataAttribute?.("copyrightOwner")}>
            {model.copyrightOwner}
          </span>
        </p>
      </div>
    </footer>
  );
}
