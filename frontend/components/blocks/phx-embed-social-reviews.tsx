"use client";

import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import { useEffect, useRef } from "react";

type PhxEmbedSocialReviewsProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "phxEmbedSocialReviews" }
>;

const DEFAULT_IFRAME_TITLE = "Google reviews";

declare global {
  interface Window {
    iFrameResize?: (
      options: Record<string, unknown>,
      element: HTMLIFrameElement,
    ) => void;
  }
}

function getEmbedSocialUrl(value?: string | null) {
  const cleaned = stegaClean(value);
  if (!cleaned) return undefined;

  try {
    const url = new URL(cleaned);
    if (
      url.protocol !== "https:" ||
      (url.hostname !== "embedsocial.com" &&
        !url.hostname.endsWith(".embedsocial.com"))
    ) {
      return undefined;
    }

    return url.toString();
  } catch {
    return undefined;
  }
}

export default function PhxEmbedSocialReviews({
  iframeSrc,
  iframeTitle,
  resizerScriptSrc,
}: PhxEmbedSocialReviewsProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const cleanIframeSrc = getEmbedSocialUrl(iframeSrc);
  const cleanResizerScriptSrc = getEmbedSocialUrl(resizerScriptSrc);
  const cleanIframeTitle =
    stegaClean(iframeTitle)?.trim() || DEFAULT_IFRAME_TITLE;

  useEffect(() => {
    if (!cleanIframeSrc || !cleanResizerScriptSrc) return;

    const initIframeResize = () => {
      if (window.iFrameResize && iframeRef.current) {
        window.iFrameResize({}, iframeRef.current);
      }
    };

    const existingScript = Array.from(document.scripts).find(
      (script) => script.src === cleanResizerScriptSrc,
    );

    if (existingScript) {
      if (window.iFrameResize) {
        initIframeResize();
        return;
      }

      existingScript.addEventListener("load", initIframeResize, {
        once: true,
      });

      return () => {
        existingScript.removeEventListener("load", initIframeResize);
      };
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = cleanResizerScriptSrc;
    script.addEventListener("load", initIframeResize, { once: true });
    document.body.appendChild(script);

    return () => {
      script.removeEventListener("load", initIframeResize);
    };
  }, [cleanIframeSrc, cleanResizerScriptSrc]);

  if (!cleanIframeSrc) return null;

  return (
    <section className="overflow-hidden bg-black" id="reviews">
      <iframe
        className="block min-h-[420px] w-full border-0"
        loading="lazy"
        ref={iframeRef}
        scrolling="no"
        src={cleanIframeSrc}
        title={cleanIframeTitle}
      />
    </section>
  );
}
