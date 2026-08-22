import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { Mail, MapPin, Phone, type LucideIcon } from "lucide-react";
import { stegaClean } from "next-sanity";
import Image from "next/image";

type PersonContactCtaBlock = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "personContactCta" }
>;

type PersonContactCtaProps = PersonContactCtaBlock & {
  dataAttribute?: (path: string) => string | undefined;
};

type ContactMethodType = "address" | "email" | "phone";

const contactMethodIcons: Readonly<Record<ContactMethodType, LucideIcon>> = {
  address: MapPin,
  email: Mail,
  phone: Phone,
};

const contactMethodSchemes: Readonly<Record<ContactMethodType, string>> = {
  address: "https:",
  email: "mailto:",
  phone: "tel:",
};

function isContactMethodType(value: unknown): value is ContactMethodType {
  return value === "address" || value === "email" || value === "phone";
}

export default function PersonContactCta({
  _key,
  contactMethods,
  credentialLine,
  dataAttribute,
  eyebrow,
  personImage,
  title,
  useCreamBackground,
}: PersonContactCtaProps) {
  const displayCredential = stegaClean(credentialLine)?.trim();
  const displayEyebrow = stegaClean(eyebrow)?.trim();
  const displayTitle = stegaClean(title)?.trim();
  const titleId = _key
    ? `person-contact-cta-${stegaClean(_key)}-title`
    : undefined;

  return (
    <section
      aria-labelledby={displayTitle ? titleId : undefined}
      className={cn(
        "section-pad min-[641px]:px-(--container-inline)",
        stegaClean(useCreamBackground) ? "surface-cream" : "surface-white",
      )}
      data-sanity={dataAttribute?.("useCreamBackground")}
    >
      <div className="mx-auto grid w-full max-w-[70rem] grid-cols-[minmax(0,1.03fr)_minmax(0,0.97fr)] items-stretch overflow-hidden rounded-frame border border-border bg-card shadow-ambient-feature max-[1100px]:grid-cols-1 max-[640px]:max-w-none max-[640px]:rounded-none max-[640px]:border-0 max-[640px]:bg-transparent max-[640px]:shadow-none">
        <div className="relative isolate flex items-end justify-center overflow-hidden bg-transparent min-[641px]:bg-muted min-[641px]:pt-10 min-[1101px]:min-h-[35.5rem] min-[1101px]:pt-12">
          <div className="relative flex h-[clamp(20rem,88vw,25rem)] w-full items-end justify-center min-[641px]:h-[clamp(24.375rem,52vw,31.25rem)] min-[1101px]:h-[32.5rem]">
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-[28%] z-0 aspect-square w-full max-w-[36.25rem] -translate-x-1/2 rounded-full bg-background min-[641px]:max-w-[41.25rem] min-[1101px]:top-[38%] min-[1101px]:max-w-[42.5rem]"
            />
            {personImage?.asset?._id ? (
              <Image
                alt={stegaClean(personImage.alt) || ""}
                blurDataURL={personImage.asset.metadata?.lqip || undefined}
                className="relative z-10 h-full w-full max-w-[30rem] object-cover object-top min-[641px]:max-w-[35rem] min-[1101px]:max-w-[42.5rem]"
                data-sanity={dataAttribute?.("personImage")}
                height={806}
                loading="lazy"
                placeholder={personImage.asset.metadata?.lqip ? "blur" : undefined}
                sizes="(min-width: 1101px) 680px, (min-width: 641px) 560px, min(100vw, 480px)"
                src={urlFor(personImage)
                  .width(960)
                  .height(806)
                  .fit("max")
                  .url()}
                width={960}
              />
            ) : null}
          </div>
        </div>

        <div className="relative z-20 flex flex-col items-start justify-center p-[clamp(2.5rem,5vw,4.25rem)] max-[1100px]:px-7 max-[1100px]:py-9 max-[640px]:px-6 max-[640px]:py-8">
          <div className="grid w-full min-w-0 justify-items-start gap-5">
            <div>
              {displayEyebrow ? (
                <p
                  className="mb-3.5 typo-eyebrow text-primary"
                  data-sanity={dataAttribute?.("eyebrow")}
                >
                  {eyebrow}
                </p>
              ) : null}
              {displayTitle ? (
                <h2
                  className="text-balance typo-section-heading text-card-foreground"
                  data-sanity={dataAttribute?.("title")}
                  id={titleId}
                >
                  {title}
                </h2>
              ) : null}
            </div>

            {contactMethods?.length ? (
              <ul className="grid w-full list-none gap-(--space-stack) border-t border-border p-0 pt-5">
                {contactMethods.map((method, index) => {
                  const methodType = stegaClean(method.type);
                  if (!isContactMethodType(methodType)) return null;

                  const Icon = contactMethodIcons[methodType];
                  const href = stegaClean(method.href)?.trim();
                  if (!href?.startsWith(contactMethodSchemes[methodType])) {
                    return null;
                  }

                  const path = method._key
                    ? `contactMethods[_key=="${method._key}"]`
                    : `contactMethods[${index}]`;
                  const opensNewTab = methodType === "address";

                  return (
                    <li data-sanity={dataAttribute?.(path)} key={method._key}>
                      <a
                        className={cn(
                          "grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3.5 font-semibold text-card-foreground no-underline transition-opacity motion-fast hover:opacity-80 focus-ring",
                          methodType === "address"
                            ? "items-start"
                            : "items-center",
                        )}
                        data-sanity={dataAttribute?.(`${path}.href`)}
                        href={href}
                        rel={opensNewTab ? "noopener noreferrer" : undefined}
                        target={opensNewTab ? "_blank" : undefined}
                      >
                        <span
                          className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground"
                          data-sanity={dataAttribute?.(`${path}.type`)}
                        >
                          <Icon aria-hidden="true" className="size-4" />
                        </span>
                        {methodType === "address" ? (
                          <address
                            className="whitespace-pre-line typo-button-lg not-italic leading-[1.4]"
                            data-sanity={dataAttribute?.(`${path}.label`)}
                          >
                            {method.label}
                          </address>
                        ) : (
                          <span
                            className={cn(
                              "whitespace-pre-line typo-button-lg leading-[1.4]",
                              methodType === "email" && "break-all",
                            )}
                            data-sanity={dataAttribute?.(`${path}.label`)}
                          >
                            {method.label}
                          </span>
                        )}
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : null}

            {displayCredential ? (
              <p
                className="mt-1.5 text-pretty typo-fine-print text-muted-foreground"
                data-sanity={dataAttribute?.("credentialLine")}
              >
                {credentialLine}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
