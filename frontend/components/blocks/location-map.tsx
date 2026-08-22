import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import Image from "next/image";

type LocationMapBlock = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "locationMap" }
>;

type LocationMapProps = LocationMapBlock & {
  dataAttribute?: (path: string) => string | undefined;
};

type LocationMapAddress = LocationMapProps["address"];

function getHttpUrl(value?: string | null) {
  const cleaned = stegaClean(value)?.trim();
  if (!cleaned) return undefined;

  try {
    const url = new URL(cleaned);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function getGoogleMapsEmbedUrl(value?: string | null) {
  const cleaned = stegaClean(value)?.trim();
  if (!cleaned) return undefined;

  try {
    const url = new URL(cleaned);
    const isGoogleHost =
      url.hostname === "google.com" || url.hostname.endsWith(".google.com");
    const isEmbed =
      url.pathname.startsWith("/maps/embed") ||
      (url.pathname.startsWith("/maps") && url.searchParams.get("output") === "embed");

    return url.protocol === "https:" && isGoogleHost && isEmbed ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function Address({
  address,
  dataAttribute,
}: Readonly<{
  address?: LocationMapAddress;
  dataAttribute?: LocationMapProps["dataAttribute"];
}>) {
  const street = stegaClean(address?.street)?.trim();
  const city = stegaClean(address?.city)?.trim();
  const region = stegaClean(address?.region)?.trim();
  const postalCode = stegaClean(address?.postalCode)?.trim();
  const country = stegaClean(address?.country)?.trim();

  return (
    <address className="grid typo-body-sm text-[#454b5e] not-italic">
      {street ? (
        <span data-sanity={dataAttribute?.("address.street")}>{address?.street}</span>
      ) : null}
      {city || region || postalCode ? (
        <span>
          {city ? <span data-sanity={dataAttribute?.("address.city")}>{address?.city}</span> : null}
          {city && region ? ", " : null}
          {region ? (
            <span data-sanity={dataAttribute?.("address.region")}>{address?.region}</span>
          ) : null}{" "}
          {postalCode ? (
            <span data-sanity={dataAttribute?.("address.postalCode")}>
              {address?.postalCode}
            </span>
          ) : null}
        </span>
      ) : null}
      {country ? (
        <span data-sanity={dataAttribute?.("address.country")}>{address?.country}</span>
      ) : null}
    </address>
  );
}

export default function LocationMap({
  _key,
  address,
  businessName,
  credentialLine,
  dataAttribute,
  directionsLabel,
  directionsUrl,
  eyebrow,
  image,
  imageEyebrow,
  imageTitle,
  mapEmbedUrl,
  mapTitle,
  title,
  useCreamBackground,
}: LocationMapProps) {
  const displayEyebrow = stegaClean(eyebrow)?.trim();
  const displayTitle = stegaClean(title)?.trim();
  const displayDirectionsLabel = stegaClean(directionsLabel)?.trim();
  const displayImageEyebrow = stegaClean(imageEyebrow)?.trim();
  const displayImageTitle = stegaClean(imageTitle)?.trim();
  const displayBusinessName = stegaClean(businessName)?.trim();
  const displayCredentialLine = stegaClean(credentialLine)?.trim();
  const cleanDirectionsUrl = getHttpUrl(directionsUrl);
  const cleanMapEmbedUrl = getGoogleMapsEmbedUrl(mapEmbedUrl);
  const cleanMapTitle = stegaClean(mapTitle)?.trim();
  const headingId = `location-map-${stegaClean(_key)}`;
  const creamSurface = Boolean(stegaClean(useCreamBackground));

  return (
    <section
      aria-labelledby={displayTitle ? headingId : undefined}
      className={cn(
        "section-pad",
        creamSurface ? "surface-cream" : "surface-white",
      )}
      data-sanity={dataAttribute?.("useCreamBackground")}
    >
      <div className="container">
        <header className="grid items-end gap-6 section-header-gap md:grid-cols-[minmax(0,35rem)_auto] md:justify-between md:gap-12">
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
                className="text-balance typo-section-heading text-foreground"
                data-sanity={dataAttribute?.("title")}
                id={headingId}
              >
                {title}
              </h2>
            ) : null}
          </div>

          {cleanDirectionsUrl && displayDirectionsLabel ? (
            <a
              className="w-fit whitespace-nowrap typo-button text-primary underline-offset-4 hover:underline focus-underline"
              data-sanity={dataAttribute?.("directionsUrl")}
              href={cleanDirectionsUrl}
            >
              <span data-sanity={dataAttribute?.("directionsLabel")}>{directionsLabel}</span>
              <span aria-hidden="true"> →</span>
            </a>
          ) : null}
        </header>

        <div className="grid items-stretch gap-6 min-[641px]:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <figure className="relative min-h-[23.75rem] overflow-hidden rounded-card border border-border bg-[var(--phx-navy-900)] shadow-ambient-feature md:min-h-[30rem]">
            {image?.asset?._id ? (
              <Image
                alt={stegaClean(image.alt) || ""}
                blurDataURL={image.asset.metadata?.lqip || undefined}
                className="object-cover"
                data-sanity={dataAttribute?.("image")}
                fill
                placeholder={image.asset.metadata?.lqip ? "blur" : undefined}
                sizes="(min-width: 1024px) 42vw, (min-width: 641px) 33vw, 100vw"
                src={urlFor(image).width(1536).height(1024).url()}
              />
            ) : null}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[linear-gradient(180deg,rgba(19,28,59,0)_45%,rgba(19,28,59,0.78)_100%)]"
            />
            <figcaption className="absolute right-6 bottom-6 left-6">
              {displayImageEyebrow ? (
                <p
                  className="mb-2 typo-eyebrow text-[#f2c4a9]"
                  data-sanity={dataAttribute?.("imageEyebrow")}
                >
                  {imageEyebrow}
                </p>
              ) : null}
              {displayImageTitle ? (
                <p
                  className="text-xl font-semibold leading-[1.3] text-white"
                  data-sanity={dataAttribute?.("imageTitle")}
                >
                  {imageTitle}
                </p>
              ) : null}
            </figcaption>
          </figure>

          <div
            className="relative min-h-[30rem] overflow-hidden rounded-card border border-border bg-muted shadow-ambient-feature"
            data-sanity={dataAttribute?.("mapEmbedUrl")}
          >
            {cleanMapEmbedUrl && cleanMapTitle ? (
              <iframe
                allowFullScreen
                className="absolute inset-0 size-full border-0"
                data-sanity={dataAttribute?.("mapTitle")}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={cleanMapEmbedUrl}
                title={cleanMapTitle}
              />
            ) : null}
            <div className="absolute top-4 right-4 left-4 max-w-[18.75rem] rounded-card border border-border bg-white/95 px-6 py-5 shadow-menu-layer backdrop-blur-sm md:top-6 md:right-auto md:left-6">
              {displayBusinessName ? (
                <p
                  className="typo-button text-[#131c3b]"
                  data-sanity={dataAttribute?.("businessName")}
                >
                  {businessName}
                </p>
              ) : null}
              {displayCredentialLine ? (
                <p
                  className="mt-0.5 mb-2 typo-fine-print text-[#9aa0ae]"
                  data-sanity={dataAttribute?.("credentialLine")}
                >
                  {credentialLine}
                </p>
              ) : null}
              <Address address={address} dataAttribute={dataAttribute} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
