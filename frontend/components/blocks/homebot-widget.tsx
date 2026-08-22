"use client";

import SectionContainer from "@/components/ui/section-container";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import Script from "next/script";
import Link from "next/link";
import { useEffect, useState } from "react";
import { homebotWidgetInitializer } from "./homebot-widget-init";

type HomebotWidgetProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "homebotWidget" }
> & {
  dataAttribute?: (path: string) => string | undefined;
};

const HOMEBOT_WIDGET_TOKEN =
  "03bb83cda45c729b233efed7893784d286d9d7ee1b085bd6";
const HOMEBOT_SCRIPT_SRC = "https://embed.homebotapp.com/lgw/v1/widget.js";

export default function HomebotWidget({
  _key,
  dataAttribute,
  heading,
}: HomebotWidgetProps) {
  const [failed, setFailed] = useState(false);
  const cleanKey = stegaClean(_key);
  const displayHeading = stegaClean(heading)?.trim();
  const containerId = `homebot_${cleanKey}`;
  const headingId = displayHeading ? `${containerId}_heading` : undefined;

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    return homebotWidgetInitializer.register({
      container,
      onFailure: () => setFailed(true),
      token: HOMEBOT_WIDGET_TOKEN,
    });
  }, [containerId]);

  return (
    <section aria-labelledby={headingId}>
      <SectionContainer className="section-pad">
        {displayHeading ? (
          <h2
            className="mx-auto max-w-4xl text-balance text-center typo-section-heading text-foreground"
            data-sanity={dataAttribute?.("heading")}
            id={headingId}
          >
            {heading}
          </h2>
        ) : null}
        <div className={displayHeading ? "mt-10" : undefined}>
          <div hidden={failed} id={containerId} />
          {failed ? (
            <p className="text-center typo-body text-muted-foreground">
              The home-value tool is unavailable right now.{" "}
              <Link className="font-semibold text-primary underline" href="/contact/">
                Schedule a consultation.
              </Link>
            </p>
          ) : null}
        </div>
      </SectionContainer>
      <Script id="homebot-namespace" strategy="afterInteractive">
        {`window.__hb_namespace = "Homebot"; window.Homebot = window.Homebot || function(){(window.Homebot.q = window.Homebot.q || []).push(arguments)}`}
      </Script>
      <Script
        async
        id="homebot-widget-loader"
        onError={() => homebotWidgetInitializer.markScriptFailed()}
        onReady={() => homebotWidgetInitializer.markScriptReady()}
        src={HOMEBOT_SCRIPT_SRC}
        strategy="afterInteractive"
      />
    </section>
  );
}
