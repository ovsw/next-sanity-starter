import { NavigationIcon } from "@/components/header/navigation-icon";
import { simpleRichTextComponents } from "@/components/simple-rich-text";
import { getSafeLinkHref } from "@/lib/safe-href";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { PortableText, toPlainText } from "@portabletext/react";
import { stegaClean } from "next-sanity";
import Link from "next/link";
import styles from "./stacked-feature-rows.module.css";

type StackedFeatureRowsProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "stackedFeatureRows" }
> & { dataAttribute?: (path: string) => string | undefined };

export default function StackedFeatureRows({
  _key,
  title,
  eyebrow,
  rows,
  useAlternateBackground,
  dataAttribute,
}: StackedFeatureRowsProps) {
  const renderableRows = (rows ?? []).flatMap((row) => {
    const items = (row.items ?? []).filter(
      (item) => item.body?.length && stegaClean(toPlainText(item.body)).trim(),
    );
    return stegaClean(row.title)?.trim() && items.length
      ? [{ row, items }]
      : [];
  });
  if (!renderableRows.length) return null;
  const headingId = `stacked-feature-rows-${stegaClean(_key)}`;
  const hasTitle = Boolean(stegaClean(title)?.trim());

  return (
    <section
      className={styles.section}
      data-alternate={stegaClean(useAlternateBackground) || undefined}
      aria-labelledby={hasTitle ? headingId : undefined}
    >
      <header>
        {stegaClean(eyebrow)?.trim() ? (
          <p data-sanity={dataAttribute?.("eyebrow")}>{eyebrow}</p>
        ) : null}
        {hasTitle ? (
          <h2 id={headingId} data-sanity={dataAttribute?.("title")}>
            {title}
          </h2>
        ) : null}
      </header>
      <ul className={styles.rows} data-sanity={dataAttribute?.("rows")}>
        {renderableRows.map(({ row, items }) => {
          const path = `rows[_key=="${row._key}"]`;
          const href = getSafeLinkHref(row.link?.href);
          const iconName = stegaClean(row.icon?.name)?.trim();
          const iconSvg = stegaClean(row.icon?.svg)?.trim();
          return (
            <li className={styles.row} key={row._key}>
              <div>
                {iconName && iconSvg ? (
                  <span
                    className={styles.icon}
                    data-sanity={dataAttribute?.(`${path}.icon`)}
                  >
                    <NavigationIcon icon={{ name: iconName, svg: iconSvg }} />
                  </span>
                ) : null}
                <h3 data-sanity={dataAttribute?.(`${path}.title`)}>
                  {row.title}
                </h3>
              </div>
              <div>
                <ul data-sanity={dataAttribute?.(`${path}.items`)}>
                  {items.map((item) => (
                    <li
                      key={item._key}
                      data-sanity={dataAttribute?.(
                        `${path}.items[_key=="${item._key}"].body`,
                      )}
                    >
                      <PortableText
                        components={simpleRichTextComponents}
                        value={item.body ?? []}
                      />
                    </li>
                  ))}
                </ul>
                {href && stegaClean(row.link?.text)?.trim() ? (
                  <Link
                    href={href}
                    data-sanity={dataAttribute?.(`${path}.link`)}
                    target={
                      stegaClean(row.link?.openInNewTab) ? "_blank" : undefined
                    }
                    rel={
                      stegaClean(row.link?.openInNewTab)
                        ? "noopener noreferrer"
                        : undefined
                    }
                  >
                    {row.link?.text}
                  </Link>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
