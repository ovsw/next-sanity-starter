import Image from "next/image";
import Link from "next/link";
import type { FooterColumnModel, FooterLinkModel, FooterModel } from "./model";
import { FooterLink } from "./footer-link";
import { FooterIcon, socialIconFor } from "./icons";

const headingClassName =
  "mb-5 text-[13px] font-semibold uppercase leading-none tracking-[0.18em] text-white/70";

// Small dim glyph next to a contact detail; brightens with the link on hover.
const detailIconClassName = "mt-[3px] size-[15px] shrink-0 text-white/45";
const detailIconOnLinkClassName = `${detailIconClassName} transition-colors motion-fast group-hover:text-white`;
const detailLinkClassName = "group flex items-start gap-2";
const officeMapLink = {
  href: "https://www.google.com/maps/place/3602+E+Campbell+Ave,+Phoenix,+AZ+85018",
  key: "office-map",
  label: "View office on Google Maps",
  openInNewTab: true,
} satisfies FooterLinkModel;

function LinkList({ links }: { links: FooterLinkModel[] }) {
  return (
    <ul className="space-y-3">
      {links.map((link) => {
        const icon = socialIconFor(link.href);
        return (
          <li key={link.key}>
            {icon ? (
              <FooterLink className="group inline-flex items-center gap-2.5" link={link}>
                <FooterIcon
                  className="size-[17px] shrink-0 text-white/50 transition-colors motion-fast group-hover:text-white"
                  name={icon}
                />
                {link.label}
              </FooterLink>
            ) : (
              <FooterLink link={link} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

// Lets the email wrap cleanly at the @ instead of mid-word when space is tight.
function EmailLabel({ label }: { label: string }) {
  const at = label.indexOf("@");
  if (at <= 0) return label;
  return (
    <>
      {label.slice(0, at)}
      <wbr />
      {label.slice(at)}
    </>
  );
}

function FooterColumn({ column }: { column: FooterColumnModel }) {
  const headingId = `footer-column-${column.key}-heading`;

  return (
    <section aria-labelledby={headingId}>
      <h3 className={headingClassName} id={headingId}>
        {column.heading}
      </h3>
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
  const firstColumn = model.columns[0]!;
  const remainingColumns = model.columns.slice(1);

  return (
    <footer className="bg-[#0c1329] pt-(--space-section) text-white" data-footer-state="ready">
      <section
        aria-labelledby="site-footer-heading"
        className="container"
      >
        <h2 className="sr-only" id="site-footer-heading">
          Site footer
        </h2>
        <div className="grid gap-12 pb-16 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1.3fr_0.9fr]">
          <section aria-labelledby="footer-brand-heading" className="flex flex-col gap-8">
            <h3 className="sr-only" id="footer-brand-heading">
              {model.brand.label}
            </h3>
            <Link
              aria-label="Home page"
              className="w-fit rounded-control focus-ring-on-dark"
              href="/"
            >
              {model.brand.image ? (
                <span className="flex w-[13rem] max-w-full flex-col items-center gap-3">
                  <Image
                    alt=""
                    className="h-auto w-full object-contain brightness-0 invert"
                    height={model.brand.image.height}
                    priority
                    quality={100}
                    src={model.brand.image.src}
                    width={model.brand.image.width}
                  />
                  {model.brand.secondaryImage ? (
                    <Image
                      alt=""
                      className="h-auto w-[85%] object-contain brightness-0 invert"
                      height={model.brand.secondaryImage.height}
                      priority
                      quality={100}
                      src={model.brand.secondaryImage.src}
                      width={model.brand.secondaryImage.width}
                    />
                  ) : null}
                </span>
              ) : (
                <span className="text-lg font-semibold text-white">{model.brand.label}</span>
              )}
            </Link>
            <div className="flex flex-col gap-2 typo-body-sm text-white/75">
              <p>NMLS ID {model.brand.organizationNmlsId}</p>
              <p className="flex items-start gap-2">
                <FooterIcon className={detailIconClassName} name="phone" />
                <span>
                  Call: <FooterLink className="inline text-white/90" link={model.brand.phone} />
                </span>
              </p>
              <FooterLink className={`${detailLinkClassName} w-fit`} link={officeMapLink}>
                <FooterIcon className={detailIconOnLinkClassName} name="pin" />
                <address className="not-italic">
                  {model.brand.addressLines.map((line) => (
                    <span className="block" key={line}>
                      {line}
                    </span>
                  ))}
                </address>
              </FooterLink>
            </div>
          </section>

          <FooterColumn column={firstColumn} />

          <section aria-labelledby="footer-contact-heading">
            <h3 className={headingClassName} id="footer-contact-heading">
              {model.contact.heading}
            </h3>
            <div className="flex flex-col gap-3 typo-body-sm text-white/80">
              <p className="flex items-start gap-2 font-semibold text-white">
                <FooterIcon className={detailIconClassName} name="person" />
                <span>
                  {model.contact.fullName}
                  <br />
                  <span className="typo-fine-print text-white/70">
                    NMLS# {model.contact.nmlsId}
                  </span>
                </span>
              </p>
              <FooterLink className={detailLinkClassName} link={model.contact.phone}>
                <FooterIcon className={detailIconOnLinkClassName} name="phone" />
                <span>{model.contact.phone.label}</span>
              </FooterLink>
              <FooterLink className={detailLinkClassName} link={model.contact.email}>
                <FooterIcon className={detailIconOnLinkClassName} name="email" />
                <span className="[overflow-wrap:normal]">
                  <EmailLabel label={model.contact.email.label} />
                </span>
              </FooterLink>
              <FooterLink className={detailLinkClassName} link={model.contact.website}>
                <FooterIcon className={detailIconOnLinkClassName} name="globe" />
                <span>{model.contact.website.label}</span>
              </FooterLink>
            </div>
          </section>

          {remainingColumns.map((column) => (
            <FooterColumn column={column} key={column.key} />
          ))}
        </div>

        <section
          aria-labelledby="footer-compliance-heading"
          className="border-t border-edge-on-dark py-8 typo-fine-print text-white/75"
        >
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-start">
            <div>
              <h3 className="sr-only" id="footer-compliance-heading">
                {model.compliance.headline}
              </h3>
              <p className="max-w-[53.75rem] text-white/70">
                {model.compliance.disclaimer}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <FooterLink
                className="inline-flex min-h-11 min-w-11 items-center justify-center"
                link={model.compliance.nmlsConsumerAccess}
              >
                <Image
                  alt={model.compliance.nmlsConsumerAccess.label}
                  className="h-10 w-auto object-contain invert"
                  height={512}
                  src="/images/footer/nmls-consumer-access.png"
                  width={703}
                />
                {model.compliance.nmlsConsumerAccess.openInNewTab ? (
                  <span className="sr-only"> (opens in a new tab)</span>
                ) : null}
              </FooterLink>
              <span className="inline-flex min-h-11 items-center">
                <Image
                  alt=""
                  className="h-10 w-auto object-contain invert"
                  height={2400}
                  src="/images/footer/equal-housing-lender.png"
                  width={2400}
                />
              </span>
            </div>
          </div>
          <div className="mt-8 border-t border-edge-on-dark pt-6">
            <p className="text-white/65">
              ©{" "}
              <span data-sanity={dataAttribute?.("compliance.copyrightStartYear")}>
                {model.compliance.copyrightYears}
              </span>{" "}
              <span data-sanity={dataAttribute?.("compliance.copyrightOwner")}>
                {model.compliance.copyrightOwner}
              </span>
              . NMLS ID{" "}
              <span data-sanity={dataAttribute?.("compliance.organizationNmlsId")}>
                {model.compliance.organizationNmlsId}
              </span>
              . Call:{" "}
              <FooterLink
                className="inline text-white/75"
                dataSanity={dataAttribute?.("compliance.organizationPhone")}
                link={model.compliance.organizationPhone}
              />
              . All rights reserved.
              {model.compliance.credit ? (
                <span data-sanity={dataAttribute?.("compliance.credit")}>
                  {` | ${model.compliance.credit}`}
                </span>
              ) : null}
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
              {model.compliance.legalLinks.map((link) => (
                <li key={link.key}>
                  <FooterLink className="typo-fine-print text-white/65" link={link} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      </section>
    </footer>
  );
}
