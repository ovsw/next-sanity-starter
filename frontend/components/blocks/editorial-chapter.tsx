import PortableTextRenderer from "@/components/portable-text-renderer";
import { cn } from "@/lib/utils";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";

type EditorialChapterProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "editorialChapter" }
> & {
  dataAttribute?: (path: string) => string | undefined;
};

type SupportingContent = NonNullable<
  EditorialChapterProps["supportingContent"]
>[number];

function hasText(value?: string | null) {
  return Boolean(stegaClean(value)?.trim());
}

function QuoteCallout({
  dataAttribute,
  module,
  path,
}: {
  dataAttribute?: EditorialChapterProps["dataAttribute"];
  module: Extract<SupportingContent, { _type: "quoteCallout" }>;
  path: string;
}) {
  if (!hasText(module.quote)) return null;

  return (
    <blockquote className="relative mt-3 blockquote-accent py-1 pl-6 md:pl-8">
      <p
        className="text-balance typo-pull-quote text-foreground"
        data-sanity={dataAttribute?.(`${path}.quote`)}
      >
        “{module.quote}”
      </p>
      {hasText(module.context) ? (
        <footer
          className="mt-3 typo-body-sm text-muted-foreground"
          data-sanity={dataAttribute?.(`${path}.context`)}
        >
          {module.context}
        </footer>
      ) : null}
    </blockquote>
  );
}

function ProofPoints({
  dataAttribute,
  module,
  path,
}: {
  dataAttribute?: EditorialChapterProps["dataAttribute"];
  module: Extract<SupportingContent, { _type: "proofPoints" }>;
  path: string;
}) {
  const visibleItems =
    module.items
      ?.filter((item) => hasText(item.title) && hasText(item.description))
      .slice(0, 3) ?? [];

  if (visibleItems.length < 2) return null;

  return (
    <ul
      className={cn(
        "grid list-none border-border p-0 lg:col-span-2",
        visibleItems.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3",
      )}
    >
      {visibleItems.map((item, index) => (
        <li
          className={cn(
            "border-b border-border py-7 last:border-b-0 lg:border-b-0 lg:py-1",
            index > 0 && "lg:border-l lg:pl-8",
            index < visibleItems.length - 1 && "lg:pr-8",
          )}
          key={item._key}
        >
          <h3
            className="typo-subsection-heading text-foreground"
            data-sanity={dataAttribute?.(
              `${path}.items[_key=="${item._key}"].title`,
            )}
          >
            {item.title}
          </h3>
          <p
            className="mt-3 typo-body-sm text-muted-foreground"
            data-sanity={dataAttribute?.(
              `${path}.items[_key=="${item._key}"].description`,
            )}
          >
            {item.description}
          </p>
        </li>
      ))}
    </ul>
  );
}

function ImpactStatement({
  dataAttribute,
  module,
  path,
}: {
  dataAttribute?: EditorialChapterProps["dataAttribute"];
  module: Extract<SupportingContent, { _type: "impactStatement" }>;
  path: string;
}) {
  if (
    !hasText(module.statement) ||
    !hasText(module.label) ||
    !hasText(module.description)
  ) {
    return null;
  }

  return (
    <aside className="grid min-w-0 gap-7 rounded-frame bg-[var(--phx-navy-900)] p-(--space-inset) text-white lg:col-span-2 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:items-center lg:gap-12">
      <div className="min-w-0">
        <p
          className="break-words typo-stat-lg"
          data-sanity={dataAttribute?.(`${path}.statement`)}
        >
          {module.statement}
        </p>
        <p
          className="mt-2 typo-meta-label leading-snug text-label-on-dark"
          data-sanity={dataAttribute?.(`${path}.label`)}
        >
          {module.label}
        </p>
      </div>
      <p
        className="min-w-0 typo-body-editorial text-white/80"
        data-sanity={dataAttribute?.(`${path}.description`)}
      >
        {module.description}
      </p>
    </aside>
  );
}

function SupportingModule({
  dataAttribute,
  module,
}: {
  dataAttribute?: EditorialChapterProps["dataAttribute"];
  module: SupportingContent;
}) {
  const path = `supportingContent[_key=="${module._key}"]`;

  switch (module._type) {
    case "quoteCallout":
      return <QuoteCallout dataAttribute={dataAttribute} module={module} path={path} />;
    case "proofPoints":
      return <ProofPoints dataAttribute={dataAttribute} module={module} path={path} />;
    case "impactStatement":
      return <ImpactStatement dataAttribute={dataAttribute} module={module} path={path} />;
    default:
      return null;
  }
}

export default function EditorialChapter({
  _key,
  dataAttribute,
  eyebrow,
  richText,
  supportingContent,
  title,
  useCreamBackground,
}: EditorialChapterProps) {
  const visibleSupportingContent = supportingContent?.slice(0, 2) ?? [];
  const fullWidthSupportingContent = visibleSupportingContent.filter(
    (module) => module._type !== "quoteCallout",
  );
  const hasTitle = hasText(title);
  const headingId = `editorial-chapter-${_key}`;

  return (
    <section
      aria-labelledby={hasTitle ? headingId : undefined}
      className={cn(
        "section-pad",
        stegaClean(useCreamBackground) ? "surface-cream" : "surface-white",
      )}
    >
      <div className="container">
        <div className="grid items-start gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-x-split lg:gap-y-12">
          <header>
            {hasText(eyebrow) ? (
              <p
                className="mb-3.5 typo-eyebrow text-primary"
                data-sanity={dataAttribute?.("eyebrow")}
              >
                {eyebrow}
              </p>
            ) : null}
            {hasTitle ? (
              <h2
                className="text-balance typo-section-heading text-foreground"
                data-sanity={dataAttribute?.("title")}
                id={headingId}
              >
                {title}
              </h2>
            ) : null}
          </header>

          <div className="grid min-w-0 gap-9">
            {richText?.length ? (
              <div
                className="grid gap-(--space-stack) text-pretty typo-body-editorial text-muted-foreground [&_p]:!mb-0"
                data-sanity={dataAttribute?.("richText")}
              >
                <PortableTextRenderer value={richText} />
              </div>
            ) : null}
            {visibleSupportingContent.map((module) =>
              module._type === "quoteCallout" ? (
                <SupportingModule
                  dataAttribute={dataAttribute}
                  key={module._key}
                  module={module}
                />
              ) : null,
            )}
          </div>

          {fullWidthSupportingContent.map((module) => (
            <SupportingModule
              dataAttribute={dataAttribute}
              key={module._key}
              module={module}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
