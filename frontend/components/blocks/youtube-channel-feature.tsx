import { Button } from "@/components/ui/button";
import { urlFor } from "@/sanity/lib/image";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { Play } from "lucide-react";
import { stegaClean } from "next-sanity";
import Image from "next/image";
import Link from "next/link";

import styles from "./youtube-channel-feature.module.css";

type YoutubeChannelFeatureBlock = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "youtubeChannelFeature" }
>;

type YoutubeChannelFeatureProps = YoutubeChannelFeatureBlock & {
  dataAttribute?: (path: string) => string | undefined;
};

type ChannelImage = YoutubeChannelFeatureProps["channelImage"];

const richTextComponents: Partial<PortableTextComponents> = {
  block: {
    normal: ({ children }) => <p>{children}</p>,
  },
};

function DesktopChannelImage({ image }: Readonly<{ image: ChannelImage }>) {
  if (!image?.asset?._id) return null;

  return (
    <Image
      alt={stegaClean(image.alt) || ""}
      blurDataURL={image.asset.metadata?.lqip || undefined}
      className="block h-auto w-full rounded-none"
      height={2288}
      loading="eager"
      placeholder={image.asset.metadata?.lqip ? "blur" : undefined}
      sizes="(min-width: 901px) min(42vw, 540px), 100vw"
      src={urlFor(image).width(552).url()}
      width={552}
    />
  );
}

export default function YoutubeChannelFeature({
  _key,
  channelImage,
  dataAttribute,
  eyebrow,
  facts,
  mobileChannelImage,
  richText,
  title,
  youtubeButton,
}: YoutubeChannelFeatureProps) {
  const titleId = _key ? `youtube-channel-${stegaClean(_key)}-title` : undefined;
  const youtubeUrl = stegaClean(youtubeButton?.url)?.trim();
  const mobileImage = mobileChannelImage?.asset?._id ? mobileChannelImage : channelImage;

  return (
    <section
      aria-labelledby={stegaClean(title)?.trim() ? titleId : undefined}
      className="relative overflow-hidden bg-[var(--phx-navy-900)] section-pad-lg"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(760px_380px_at_12%_-14%,rgba(180,85,45,0.24),transparent_68%),radial-gradient(620px_360px_at_96%_110%,rgba(180,85,45,0.12),transparent_70%)]"
      />
      <div className="container relative">
        <div className="grid max-w-[35rem] justify-items-start gap-5 max-[900px]:max-w-none min-[901px]:max-w-[min(35rem,52%)]">
          <div>
            <p
              className="mb-3.5 typo-eyebrow text-label-on-dark/90"
              data-sanity={dataAttribute?.("eyebrow")}
            >
              {eyebrow}
            </p>
            <h2
              className="text-balance typo-section-heading text-white"
              data-sanity={dataAttribute?.("title")}
              id={titleId}
            >
              {title}
            </h2>
          </div>
          {richText?.length ? (
            <div
              className="grid gap-(--space-stack) text-pretty typo-body-editorial text-white/70"
              data-sanity={dataAttribute?.("richText")}
            >
              <PortableText components={richTextComponents} value={richText} />
            </div>
          ) : null}
          <dl className="grid w-full grid-cols-3 gap-x-2 pt-1.5 min-[901px]:flex min-[901px]:w-auto min-[901px]:flex-wrap min-[901px]:gap-x-10 min-[901px]:gap-y-5">
            {facts?.map((fact) => (
              <div className="grid min-w-0 gap-1" key={fact._key}>
                <dt
                  className="order-2 whitespace-nowrap typo-meta-label text-label-on-dark/90"
                  data-sanity={dataAttribute?.(`facts[_key=="${fact._key}"].label`)}
                >
                  {fact.label}
                </dt>
                <dd
                  className="order-1 typo-stat-md text-white"
                  data-sanity={dataAttribute?.(`facts[_key=="${fact._key}"].value`)}
                >
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
          {mobileImage?.asset?._id ? (
            <div
              className={`${styles.mobileFrame} relative`}
              data-sanity={dataAttribute?.(
                mobileChannelImage?.asset?._id ? "mobileChannelImage" : "channelImage",
              )}
            >
              <Image
                alt={stegaClean(mobileImage.alt) || ""}
                blurDataURL={mobileImage.asset.metadata?.lqip || undefined}
                className="object-cover object-center"
                fill
                loading="eager"
                placeholder={mobileImage.asset.metadata?.lqip ? "blur" : undefined}
                sizes="(max-width: 900px) calc(100vw - 32px), 0px"
                src={urlFor(mobileImage).width(1600).url()}
              />
            </div>
          ) : null}
          {youtubeUrl ? (
            <div
              className="w-full min-[901px]:mt-2 min-[901px]:w-auto"
              data-sanity={dataAttribute?.("youtubeButton")}
            >
              <Button
                asChild
                className="w-full min-[901px]:w-auto min-[901px]:min-w-[13.1875rem]"
                emphasis
                variant="copper"
              >
                <Link href={youtubeUrl} prefetch={false}>
                  <Play aria-hidden="true" className="size-4 fill-current" />
                  {youtubeButton?.label}
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {channelImage?.asset?._id ? (
        <div className={styles.frame}>
          <div className={styles.track} data-sanity={dataAttribute?.("channelImage")}>
            <DesktopChannelImage image={channelImage} />
            <div aria-hidden="true">
              <Image
                alt=""
                className="block h-auto w-full rounded-none"
                height={2288}
                loading="eager"
                sizes="(min-width: 901px) min(42vw, 540px), 100vw"
                src={urlFor(channelImage).width(552).url()}
                width={552}
              />
            </div>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0)_30%,rgba(6,10,22,0)_60%,rgba(6,10,22,0.45)_100%)]"
          />
        </div>
      ) : null}
    </section>
  );
}
