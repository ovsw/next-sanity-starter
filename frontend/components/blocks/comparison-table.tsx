import { simpleRichTextComponents } from "@/components/simple-rich-text";
import { cn } from "@/lib/utils";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { PortableText } from "@portabletext/react";
import { stegaClean } from "next-sanity";

type ComparisonTableProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "comparisonTable" }
> & {
  dataAttribute?: (path: string) => string | undefined;
};

function hasText(value?: string | null) {
  return Boolean(stegaClean(value)?.trim());
}

/**
 * Header cells for option columns use the "Eyebrow|Title" convention from the
 * Studio field: text before the first "|" renders as a small label above the
 * option name. Slicing the raw string (rather than a cleaned copy) keeps the
 * invisible stega characters, so click-to-edit still works on both halves.
 */
function splitOptionHeader(raw: string | null | undefined) {
  const value = raw ?? "";
  const separator = value.indexOf("|");
  if (separator === -1) return { eyebrow: null, title: value };
  return {
    eyebrow: value.slice(0, separator),
    title: value.slice(separator + 1),
  };
}

function isEmptyCell(value: string | null | undefined) {
  const clean = stegaClean(value)?.trim() ?? "";
  return !clean || clean === "—" || clean === "-";
}

export default function ComparisonTable({
  _key,
  cards,
  cardsLabel,
  dataAttribute,
  eyebrow,
  intro,
  note,
  table,
  tableLabel,
  title,
  useCreamBackground,
}: ComparisonTableProps) {
  const rows = table?.rows ?? [];
  const [headerRow, ...bodyRows] = rows;
  const hasTable = Boolean(headerRow?.cells?.length && bodyRows.length);
  const hasCards = Boolean(cards?.length);
  if (!hasTable && !hasCards) return null;

  const displayTitle = stegaClean(title)?.trim();
  const headingId = `comparison-table-${stegaClean(_key)}`;
  const headerCells = headerRow?.cells ?? [];

  return (
    <section
      aria-labelledby={displayTitle ? headingId : undefined}
      className={cn(
        "scroll-mt-24 section-pad",
        stegaClean(useCreamBackground) ? "surface-cream" : "surface-white",
      )}
      id={`compare-${stegaClean(_key)}`}
    >
      <div className="container">
        <header className="max-w-3xl section-header-gap">
          {hasText(eyebrow) ? (
            <p
              className="mb-3.5 typo-eyebrow text-primary"
              data-sanity={dataAttribute?.("eyebrow")}
            >
              {eyebrow}
            </p>
          ) : null}
          {displayTitle ? (
            <h2
              className="text-balance typo-section-heading text-foreground"
              data-sanity={dataAttribute?.("title")}
              id={headingId}
            >
              {title}
            </h2>
          ) : null}
          {hasText(intro) ? (
            <p
              className="mt-5 text-pretty typo-body-editorial text-muted-foreground"
              data-sanity={dataAttribute?.("intro")}
            >
              {intro}
            </p>
          ) : null}
        </header>

        {hasTable ? (
          <>
            {hasText(tableLabel) ? (
              <p
                className="mb-4 typo-meta-label text-muted-foreground"
                data-sanity={dataAttribute?.("tableLabel")}
              >
                {tableLabel}
              </p>
            ) : null}
            <div className="overflow-x-auto" data-sanity={dataAttribute?.("table")}>
              <div className="min-w-[42.5rem] overflow-hidden rounded-card border border-border">
                <table className="w-full table-fixed border-separate border-spacing-0 text-left">
                  <thead>
                    <tr>
                      {headerCells.map((cell, cellIndex) => {
                        const cellPath = `table.rows[_key=="${headerRow?._key}"].cells[${cellIndex}]`;
                        if (cellIndex === 0) {
                          return (
                            <th
                              className="w-[36%] bg-background px-6 py-5 align-bottom typo-meta-label text-muted-foreground"
                              data-sanity={dataAttribute?.(cellPath)}
                              key={cellIndex}
                              scope="col"
                            >
                              {cell}
                            </th>
                          );
                        }
                        const { eyebrow: cellEyebrow, title: cellTitle } =
                          splitOptionHeader(cell);
                        return (
                          <th
                            className="border-l border-border bg-background px-6 py-5 align-bottom"
                            data-sanity={dataAttribute?.(cellPath)}
                            key={cellIndex}
                            scope="col"
                          >
                            {cellEyebrow ? (
                              <span className="mb-1.5 block typo-meta-label text-muted-foreground">
                                {cellEyebrow}
                              </span>
                            ) : null}
                            <span className="block typo-subsection-heading text-foreground">
                              {cellTitle}
                            </span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {bodyRows.map((row) => {
                      const rowPath = `table.rows[_key=="${row._key}"]`;
                      return (
                        <tr data-sanity={dataAttribute?.(rowPath)} key={row._key}>
                          {(row.cells ?? []).map((cell, cellIndex) => {
                            const cellPath = `${rowPath}.cells[${cellIndex}]`;
                            if (cellIndex === 0) {
                              return (
                                <th
                                  className="border-t border-border bg-secondary px-6 py-5 text-left align-top typo-body-sm font-semibold text-foreground"
                                  data-sanity={dataAttribute?.(cellPath)}
                                  key={cellIndex}
                                  scope="row"
                                >
                                  {cell}
                                </th>
                              );
                            }
                            const empty = isEmptyCell(cell);
                            return (
                              <td
                                className={cn(
                                  "border-l border-t border-border px-6 py-5 align-top typo-body-sm",
                                  empty
                                    ? "text-muted-foreground/60"
                                    : "text-muted-foreground",
                                )}
                                data-sanity={dataAttribute?.(cellPath)}
                                key={cellIndex}
                              >
                                {empty ? "—" : cell}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}

        {hasCards ? (
          <div className={hasTable ? "mt-14" : undefined}>
            {hasText(cardsLabel) ? (
              <div className="mb-5 flex items-center gap-4">
                <p
                  className="whitespace-nowrap typo-meta-label text-muted-foreground"
                  data-sanity={dataAttribute?.("cardsLabel")}
                >
                  {cardsLabel}
                </p>
                <span aria-hidden="true" className="h-px flex-1 bg-border" />
              </div>
            ) : null}
            <ul
              className="grid list-none gap-6 p-0 sm:grid-cols-2"
              data-sanity={dataAttribute?.("cards")}
            >
              {cards?.map((card) => {
                const cardPath = `cards[_key=="${card._key}"]`;
                return (
                  <li
                    className="flex h-full flex-col gap-3 rounded-card border border-border bg-card p-(--space-card) text-card-foreground"
                    key={card._key}
                  >
                    {hasText(card.eyebrow) ? (
                      <p
                        className="typo-meta-label text-muted-foreground"
                        data-sanity={dataAttribute?.(`${cardPath}.eyebrow`)}
                      >
                        {card.eyebrow}
                      </p>
                    ) : null}
                    {hasText(card.title) ? (
                      <h3
                        className="typo-card-title text-foreground"
                        data-sanity={dataAttribute?.(`${cardPath}.title`)}
                      >
                        {card.title}
                      </h3>
                    ) : null}
                    {card.body?.length ? (
                      <div
                        className="grid gap-(--space-stack) text-pretty typo-body text-muted-foreground"
                        data-sanity={dataAttribute?.(`${cardPath}.body`)}
                      >
                        <PortableText
                          components={simpleRichTextComponents}
                          value={card.body}
                        />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {note?.length ? (
          <div
            className="mt-7 grid gap-(--space-stack) text-pretty typo-body-sm text-muted-foreground"
            data-sanity={dataAttribute?.("note")}
          >
            <PortableText components={simpleRichTextComponents} value={note} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
