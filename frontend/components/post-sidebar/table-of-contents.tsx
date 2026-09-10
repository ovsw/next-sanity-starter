"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { PostHeading } from "./model";

function flattenHeadings(headings: PostHeading[]): PostHeading[] {
  return headings.flatMap((heading) => [
    heading,
    ...flattenHeadings(heading.children),
  ]);
}

function HeadingLinks({
  activeId,
  headings,
}: {
  activeId: string | null;
  headings: PostHeading[];
}) {
  return (
    // Shadcnblocks navbar1 list treatment inside the faq1 disclosure.
    <ul className="space-y-4 text-sm">
      {headings.map((heading) => (
        <li key={heading.id}>
          <a
            aria-current={activeId === heading.id ? "location" : undefined}
            className={cn(
              "block leading-5 underline-offset-4 hover:text-foreground hover:underline",
              activeId === heading.id
                ? "font-semibold text-foreground"
                : "text-muted-foreground",
            )}
            href={`#${heading.id}`}
          >
            {heading.text}
          </a>
          {heading.children.length ? (
            <div className="pl-4">
              <HeadingLinks activeId={activeId} headings={heading.children} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function PostTableOfContents({ headings }: { headings: PostHeading[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const elements = flattenHeadings(headings).flatMap((heading) => {
      const element = document.getElementById(heading.id);
      return element ? [element] : [];
    });
    if (elements.length === 0 || !("IntersectionObserver" in window)) return;

    const updateActiveHeading = () => {
      const readingLine = window.innerHeight * 0.3;
      let nextActiveId: string | null = null;

      for (const element of elements) {
        if (element.getBoundingClientRect().top <= readingLine) {
          nextActiveId = element.id;
        } else {
          break;
        }
      }

      setActiveId(nextActiveId ?? elements[0]?.id ?? null);
    };
    const observer = new IntersectionObserver(updateActiveHeading, {
      rootMargin: "-20% 0px -70% 0px",
      threshold: [0, 1],
    });

    for (const element of elements) observer.observe(element);
    updateActiveHeading();

    return () => observer.disconnect();
  }, [headings]);

  return (
    <nav aria-label="Table of Contents">
      <HeadingLinks activeId={activeId} headings={headings} />
    </nav>
  );
}
