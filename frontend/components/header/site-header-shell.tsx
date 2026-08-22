"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Sticky page-level navigation should use `top: var(--site-header-offset)`. */
export const SITE_HEADER_OFFSET_PROPERTY = "--site-header-offset";
/* Must stay in sync with the --header-height token in globals.css. */
export const SITE_HEADER_HEIGHT = "var(--header-height)";

export function SiteHeaderShell({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    const update = () => {
      const current = window.scrollY;
      const delta = current - lastScrollY.current;
      if (current <= 8) setVisible(true);
      else if (Math.abs(delta) >= 8) setVisible(delta < 0 || current < 120);
      if (Math.abs(delta) >= 8 || current <= 8) lastScrollY.current = current;
      ticking.current = false;
    };
    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        window.requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      SITE_HEADER_OFFSET_PROPERTY,
      visible ? SITE_HEADER_HEIGHT : "0px",
    );
    return () => {
      document.documentElement.style.removeProperty(SITE_HEADER_OFFSET_PROPERTY);
    };
  }, [visible]);

  return (
    <header
      className={cn(
        "sticky top-0 z-[60] w-full border-b border-border/80 bg-background/95 backdrop-blur-md",
        "transition-transform motion-slow will-change-transform motion-reduce:transition-none",
        visible ? "translate-y-0" : "-translate-y-full",
      )}
      data-visible={visible}
      onFocusCapture={() => setVisible(true)}
    >
      {children}
    </header>
  );
}
