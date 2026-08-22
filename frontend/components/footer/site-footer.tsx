import Image from "next/image";
import Link from "next/link";
import { FooterLink } from "./footer-link";
import type { FooterColumnModel, FooterLinkModel, FooterModel } from "./model";

function LinkList({ links }: { links: FooterLinkModel[] }) {
  return (
    <ul>
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
      <h2 id={headingId}>{column.heading}</h2>
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
    <footer data-footer-state="ready">
      <Link aria-label={`${model.brand.label} home page`} href="/">
        {model.brand.image ? (
          <Image
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
        <p data-sanity={dataAttribute?.("intro")}>{model.intro}</p>
      ) : null}
      {model.columns.map((column) => (
        <FooterColumn column={column} key={column.key} />
      ))}
      {hasContact ? (
        <section aria-labelledby="footer-contact">
          <h2 id="footer-contact">Contact</h2>
          {model.contact.email ? <FooterLink link={model.contact.email} /> : null}
          {model.contact.phone ? <FooterLink link={model.contact.phone} /> : null}
          {model.contact.addressLines.length ? (
            <address>
              {model.contact.addressLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </address>
          ) : null}
        </section>
      ) : null}
      <p>
        © <span data-sanity={dataAttribute?.("copyrightStartYear")}>{model.copyrightYears}</span>{" "}
        <span data-sanity={dataAttribute?.("copyrightOwner")}>{model.copyrightOwner}</span>
      </p>
      {model.socialLinks.length ? (
        <nav aria-label="Social links">
          <LinkList links={model.socialLinks} />
        </nav>
      ) : null}
      {model.legalLinks.length ? (
        <nav aria-label="Legal links">
          <LinkList links={model.legalLinks} />
        </nav>
      ) : null}
    </footer>
  );
}
