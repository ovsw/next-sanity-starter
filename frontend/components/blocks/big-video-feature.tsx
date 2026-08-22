"use client";

import { urlFor } from "@/sanity/lib/image";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { getYouTubeVideoId } from "@/lib/youtube-video-id";
import { XIcon } from "lucide-react";
import { stegaClean } from "next-sanity";
import Image from "next/image";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type RefObject,
} from "react";

export type BigVideoDataAttributes = {
  description?: string;
  eyebrow?: string;
  thumbnailImage?: string;
  title?: string;
  youtubeUrl?: string;
};

type BigVideoFeatureProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "bigVideoFeature" }
> & {
  dataAttributes?: BigVideoDataAttributes;
};

type BigVideoLightboxProps = {
  closeRef: RefObject<HTMLButtonElement | null>;
  embedUrl: string;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  onClose: () => void;
  title?: string;
  titleId: string;
};

function BigVideoLightbox({
  closeRef,
  embedUrl,
  iframeRef,
  onClose,
  title,
  titleId,
}: Readonly<BigVideoLightboxProps>) {
  return (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#080d1e]/85 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
      role="dialog"
    >
      <button
        aria-label="Return focus to video"
        className="sr-only"
        onFocus={() => iframeRef.current?.focus()}
        type="button"
      />
      <div className="relative w-full max-w-5xl rounded-frame border border-edge-on-dark bg-[#0c1329] p-2 shadow-media-frame">
        <h3 className="sr-only" id={titleId}>
          {title ? `${title} video` : "Featured video"}
        </h3>
        <button
          aria-label="Close video"
          className="absolute -top-12 right-0 flex size-10 items-center justify-center rounded-full border border-edge-on-dark-strong bg-white/10 text-white transition-colors motion-fast hover:bg-white/20 focus-ring-on-dark"
          onClick={onClose}
          ref={closeRef}
          type="button"
        >
          <XIcon aria-hidden="true" className="size-5" />
        </button>
        <div className="aspect-video overflow-hidden rounded-frame-inner bg-black">
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full"
            ref={iframeRef}
            src={embedUrl}
            title={title || "Featured video"}
          />
        </div>
      </div>
      <button
        aria-label="Return focus to close button"
        className="sr-only"
        onFocus={() => closeRef.current?.focus()}
        type="button"
      />
    </div>
  );
}

export default function BigVideoFeature({
  dataAttributes,
  description,
  eyebrow,
  thumbnailImage,
  title,
  youtubeUrl,
}: BigVideoFeatureProps) {
  const displayDescription = stegaClean(description)?.trim();
  const displayEyebrow = stegaClean(eyebrow)?.trim();
  const displayTitle = stegaClean(title)?.trim();
  const videoId = getYouTubeVideoId(stegaClean(youtubeUrl));
  const embedUrl = videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`
    : null;
  const fallbackThumbnailUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    : null;
  const headingId = useId();
  const dialogTitleId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [isOpen]);

  return (
    <section
      aria-labelledby={displayTitle ? headingId : undefined}
      className="relative overflow-hidden bg-[var(--phx-navy-800)] section-pad"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(760px_340px_at_78%_-20%,rgba(180,85,45,0.22),transparent_66%)]"
      />
      <div className="container relative grid justify-items-center text-center">
        {displayEyebrow ? (
          <p
            className="typo-eyebrow text-label-on-dark/90"
            data-sanity={dataAttributes?.eyebrow}
          >
            {eyebrow}
          </p>
        ) : null}
        {displayTitle ? (
          <h2
            className="mt-3.5 max-w-[47.5rem] text-balance typo-section-heading text-white"
            data-sanity={dataAttributes?.title}
            id={headingId}
          >
            {title}
          </h2>
        ) : null}
        {displayDescription ? (
          <p
            className="mb-8 mt-5 max-w-[38.75rem] text-pretty typo-body-editorial text-white/70"
            data-sanity={dataAttributes?.description}
          >
            {description}
          </p>
        ) : (
          <div className="h-8" />
        )}

        <button
          aria-label={displayTitle ? `Play: ${displayTitle}` : "Play video"}
          className="group relative block aspect-video w-full max-w-[57.5rem] cursor-pointer overflow-hidden rounded-frame bg-[var(--phx-navy-900)] shadow-[0_30px_70px_-24px_rgba(0,0,0,0.7)] [--focus-ring-keep:0_30px_70px_-24px_rgba(0,0,0,0.7)] transition-transform motion-base hover:-translate-y-0.5 focus-ring-on-dark disabled:cursor-not-allowed"
          data-sanity={dataAttributes?.youtubeUrl}
          disabled={!embedUrl}
          onClick={() => setIsOpen(Boolean(embedUrl))}
          ref={triggerRef}
          type="button"
        >
          {thumbnailImage?.asset?._id ? (
            <Image
              alt={thumbnailImage.alt || displayTitle || "Featured video"}
              className="object-cover"
              data-sanity={dataAttributes?.thumbnailImage}
              fill
              sizes="(min-width: 1024px) 920px, 100vw"
              src={urlFor(thumbnailImage).width(1280).height(720).url()}
            />
          ) : fallbackThumbnailUrl ? (
            <span
              aria-label={displayTitle || "Featured video"}
              className="absolute inset-0 bg-cover bg-center"
              role="img"
              style={{ backgroundImage: `url(${fallbackThumbnailUrl})` }}
            />
          ) : null}
          <span className="absolute inset-0 bg-gradient-to-b from-[var(--phx-navy-900)]/5 to-[var(--phx-navy-900)]/40" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-copper-600/95 text-white shadow-[0_12px_40px_var(--phx-copper-shadow)] transition-transform motion-base group-hover:scale-105 group-focus-visible:scale-105 md:size-[5.5rem]">
              <span
                aria-hidden="true"
                className="ml-1 h-0 w-0 border-y-[11px] border-y-transparent border-l-[18px] border-l-current md:border-y-[15px] md:border-l-[24px]"
              />
            </span>
          </span>
        </button>
      </div>

      {isOpen && embedUrl ? (
        <BigVideoLightbox
          closeRef={closeRef}
          embedUrl={embedUrl}
          iframeRef={iframeRef}
          onClose={() => setIsOpen(false)}
          title={displayTitle}
          titleId={dialogTitleId}
        />
      ) : null}
    </section>
  );
}
