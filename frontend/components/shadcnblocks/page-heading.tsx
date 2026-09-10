import type { ReactNode } from "react";

// Shadcnblocks blogpost1: centered heading and description group.
export function PageHeading({
  title,
  description,
  titleAttribute,
  descriptionAttribute,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  titleAttribute?: string;
  descriptionAttribute?: string;
  children?: ReactNode;
}) {
  return (
    <header className="container py-24 md:py-32">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center">
        {children}
        <h1
          className="max-w-3xl text-5xl font-semibold text-pretty md:text-6xl"
          data-sanity={titleAttribute}
        >
          {title}
        </h1>
        {description && (
          <p
            className="max-w-3xl text-lg text-muted-foreground md:text-xl"
            data-sanity={descriptionAttribute}
          >
            {description}
          </p>
        )}
      </div>
    </header>
  );
}
