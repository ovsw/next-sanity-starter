import type { ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

// Shadcnblocks blog1. Separate links keep category navigation accessible.
export function PostCard({
  title,
  href,
  description,
  image,
  category,
  date,
  titleAttribute,
  descriptionAttribute,
}: {
  title: ReactNode;
  href: string;
  description?: ReactNode;
  image?: ReactNode;
  category?: ReactNode;
  date?: ReactNode;
  titleAttribute?: string;
  descriptionAttribute?: string;
}) {
  return (
    <article className="group flex h-full flex-col justify-between rounded-xl border border-border bg-accent p-6">
      <div>
        {image && (
          <div className="flex aspect-3/2 overflow-clip rounded-xl">
            <div className="relative h-full w-full origin-bottom transition duration-300 motion-reduce:transition-none group-hover:scale-105 [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_figure]:h-full">
              {image}
            </div>
          </div>
        )}
        <h3
          className="mb-2 line-clamp-3 pt-4 text-lg font-medium break-words md:mb-3 md:text-2xl"
          data-sanity={titleAttribute}
        >
          <Link className="hover:underline underline-offset-4" href={href}>
            {title}
          </Link>
        </h3>
        {description && (
          <p
            className="mb-8 line-clamp-2 text-sm text-muted-foreground md:mb-12 md:text-base lg:mb-9"
            data-sanity={descriptionAttribute}
          >
            {description}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {category && <Badge variant="outline">{category}</Badge>}
        {date}
      </div>
    </article>
  );
}
