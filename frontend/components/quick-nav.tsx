"use client";

import { useEffect, useRef, useState } from "react";
import type { QuickNavItem } from "@/lib/quick-nav";
import { cn } from "@/lib/utils";

const READING_LINE_RATIO = 0.35;
const PAGE_BOTTOM_TOLERANCE = 2;

export default function QuickNav({ items }: { items: QuickNavItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let frame: number | null = null;
    const updateActiveItem = () => {
      frame = null;
      /* The nav is the bottom edge of the sticky chrome (site header + this
         bar), so the reading line sits 35% into the content area actually
         visible below it. Measuring from the raw viewport top would put the
         line behind the chrome on short viewports, leaving a just-clicked
         section's pill inactive even though the section is at the top. */
      const chromeBottom = navRef.current?.getBoundingClientRect().bottom ?? 0;
      const readingLine =
        chromeBottom + (window.innerHeight - chromeBottom) * READING_LINE_RATIO;
      let nextActiveId: string | null = null;

      for (const item of items) {
        const section = document.getElementById(item.id);
        if (section && section.getBoundingClientRect().top <= readingLine) {
          nextActiveId = item.id;
        }
      }

      const lastItem = items.at(-1);
      const isAtPageBottom =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - PAGE_BOTTOM_TOLERANCE;
      if (
        nextActiveId &&
        lastItem &&
        document.getElementById(lastItem.id) &&
        isAtPageBottom
      ) {
        nextActiveId = lastItem.id;
      }

      setActiveId(nextActiveId);
    };
    const scheduleUpdate = () => {
      if (frame === null) {
        frame = window.requestAnimationFrame(updateActiveItem);
      }
    };

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("hashchange", scheduleUpdate);
    scheduleUpdate();

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("hashchange", scheduleUpdate);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [items]);

  return (
    <nav
      aria-label="On this page"
      ref={navRef}
      className="sticky top-[var(--site-header-offset,var(--header-height))] z-50 bg-accent transition-[top] motion-slow motion-reduce:transition-none"
    >
      <div className="container flex h-14 items-center gap-2 overflow-x-auto">
        <span className="mr-2 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground/70">
          On this page
        </span>
        {items.map((item) => (
          <a
            aria-current={activeId === item.id ? "location" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-colors motion-fast focus-ring-on-dark",
              activeId === item.id
                ? "bg-white font-semibold text-accent hover:bg-white"
                : "text-accent-foreground hover:bg-white/15",
            )}
            href={`#${item.id}`}
            key={item.key}
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
