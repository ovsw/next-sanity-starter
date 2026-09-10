import {
  FeatureGrid,
  FeatureCard,
} from "@/components/shadcnblocks/feature-grid";
import { NavigationIcon } from "@/components/header/navigation-icon";
import { simpleRichTextComponents } from "@/components/simple-rich-text";
import { getSafeLinkHref } from "@/lib/safe-href";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { PortableText } from "@portabletext/react";
import { stegaClean } from "next-sanity";
import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
type Props = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "stackedFeatureRows" }
> & { dataAttribute?: (path: string) => string | undefined };
export default function StackedFeatureRows({
  _key,
  title,
  rows,
  dataAttribute,
}: Props) {
  if (!rows?.length) return null;
  return (
    <FeatureGrid
      title={title}
      id={`stacked-feature-rows-${stegaClean(_key)}`}
      titleAttribute={dataAttribute?.("title")}
    >
      {rows.map((row) => {
        const path = `rows[_key=="${row._key}"]`;
        const name = stegaClean(row.icon?.name)?.trim();
        const svg = stegaClean(row.icon?.svg)?.trim();
        const href = getSafeLinkHref(row.link?.href);
        return (
          <FeatureCard
            key={row._key}
            title={row.title}
            titleAttribute={dataAttribute?.(`${path}.title`)}
            icon={name && svg ? <NavigationIcon icon={{ name, svg }} /> : null}
            body={
              <>
                {row.items?.map((item) => (
                  <div
                    key={item._key}
                    data-sanity={dataAttribute?.(
                      `${path}.items[_key=="${item._key}"].body`,
                    )}
                  >
                    <PortableText
                      components={simpleRichTextComponents}
                      value={item.body ?? []}
                    />
                  </div>
                ))}
                {href && row.link?.text && (
                  <Link
                    className="block text-sm font-medium text-foreground underline underline-offset-4"
                    href={href}
                    target={
                      stegaClean(row.link.openInNewTab) ? "_blank" : undefined
                    }
                    rel={
                      stegaClean(row.link.openInNewTab)
                        ? "noopener noreferrer"
                        : undefined
                    }
                    data-sanity={dataAttribute?.(`${path}.link`)}
                  >
                    {row.link.text}
                  </Link>
                )}
              </>
            }
            image={
              row.image?.asset?._id ? (
                <Image
                  className="aspect-4/3 w-full rounded-tl-md object-cover object-top"
                  width={600}
                  height={450}
                  src={urlFor(row.image).width(600).height(450).url()}
                  alt={stegaClean(row.image.alt) || ""}
                  data-sanity={dataAttribute?.(`${path}.image`)}
                />
              ) : null
            }
          />
        );
      })}
    </FeatureGrid>
  );
}
