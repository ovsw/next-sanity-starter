import { YouTubeEmbed } from "@next/third-parties/google";
import {
  PortableText,
  type PortableTextBlockComponent,
  type PortableTextProps,
} from "@portabletext/react";
import { buttonVariants } from "@/components/ui/button";
import { CustomLinkMarkRenderer } from "@/components/portable-text/custom-link-mark";
import { getSafeLinkHref } from "@/lib/safe-href";
import { cn } from "@/lib/utils";
import { stegaClean } from "next-sanity";
import Image from "next/image";
import Link from "next/link";

type GetHeadingId = (block: { _key?: string }) => string | undefined;
type RichTextBlockComponents = Extract<
  NonNullable<PortableTextProps["components"]>["block"],
  Record<string, unknown>
>;

function getYouTubeVideoId(value: unknown) {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] ?? null;
    }
    if (hostname === "youtube.com" || hostname === "youtube-nocookie.com") {
      return url.pathname.startsWith("/embed/")
        ? (url.pathname.split("/").filter(Boolean)[1] ?? null)
        : url.searchParams.get("v");
    }
  } catch {
    return null;
  }

  return null;
}

function getSafeIframeSrc(value: unknown) {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function getButtonVariant(value: unknown) {
  const variant = stegaClean(value);
  return variant === "secondary" || variant === "outline" || variant === "link"
    ? variant
    : "default";
}

type HeadingTag = "h2" | "h3" | "h4" | "h5" | "h6";

function createHeadingComponent(
  Tag: HeadingTag,
  className: string,
  getHeadingId?: GetHeadingId,
): PortableTextBlockComponent {
  return function RichTextHeading({ children, value }) {
    return (
      <Tag
        className={cn(className, getHeadingId && "scroll-mt-28")}
        id={getHeadingId?.(value)}
      >
        {children}
      </Tag>
    );
  };
}

function createRichTextHeadingComponents(getHeadingId?: GetHeadingId) {
  return {
    h2: createHeadingComponent("h2", "mb-4 mt-12 first:mt-0", getHeadingId),
    h3: createHeadingComponent("h3", "mb-4 mt-10 first:mt-0", getHeadingId),
    h4: createHeadingComponent("h4", "mb-4 mt-8 first:mt-0", getHeadingId),
    h5: createHeadingComponent("h5", "mb-4 mt-8 first:mt-0", getHeadingId),
    h6: createHeadingComponent(
      "h6",
      "mb-4 mt-8 text-base font-semibold first:mt-0",
      getHeadingId,
    ),
  };
}

const richTextBlockComponents = {
  normal: ({ children }) => <p className="mb-4">{children}</p>,
  ...createRichTextHeadingComponents(),
  inline: ({ children }) => <span>{children}</span>,
} satisfies RichTextBlockComponents;

export const richTextContentComponents: PortableTextProps["components"] = {
  block: richTextBlockComponents,
  list: {
    bullet: ({ children }) => (
      <ul className="mb-4 list-outside list-disc space-y-2 pl-6">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="mb-4 list-outside list-decimal space-y-2 pl-6">{children}</ol>
    ),
  },
  marks: {
    customLink: CustomLinkMarkRenderer,
    buttonLink: ({ children, value }) => {
      const href = getSafeLinkHref(value?.href);
      return href ? (
        <Link
          className={cn(
            buttonVariants({ variant: getButtonVariant(value.variant) }),
            "my-2 no-underline",
          )}
          href={href}
          rel={value.openInNewTab ? "noopener noreferrer" : undefined}
          target={value.openInNewTab ? "_blank" : undefined}
        >
          {children}
        </Link>
      ) : (
        <span>{children}</span>
      );
    },
  },
  types: {
    image: ({ value }) => {
      const asset = value.resolvedAsset;
      if (!asset?.url) return null;

      return (
        <figure className="my-4">
          <Image
            alt={value.alt || ""}
            blurDataURL={asset.metadata?.lqip || undefined}
            className="h-auto w-full rounded-card"
            height={asset.metadata?.dimensions?.height ?? 900}
            placeholder={asset.metadata?.lqip ? "blur" : undefined}
            quality={100}
            sizes="(min-width: 1024px) 896px, calc(100vw - 2rem)"
            src={asset.url}
            width={asset.metadata?.dimensions?.width ?? 1600}
          />
          {value.caption ? (
            <figcaption className="mt-2 text-center text-sm text-muted-foreground">
              {value.caption}
            </figcaption>
          ) : null}
        </figure>
      );
    },
    table: ({ value }) => {
      const rows = Array.isArray(value.rows)
        ? value.rows.filter(
            (row: { cells?: unknown[] }) =>
              Array.isArray(row.cells) && row.cells.length > 0,
          )
        : [];
      const [headerRow, ...bodyRows] = rows;
      if (!headerRow) return null;

      return (
        <div className="my-8 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
            {value.title ? <caption className="sr-only">{value.title}</caption> : null}
            <thead>
              <tr>
                {headerRow.cells.map((cell: string, index: number) => (
                  <th
                    className="border border-border bg-muted px-4 py-3 font-semibold text-foreground"
                    key={`${headerRow._key ?? "header"}-${index}`}
                    scope="col"
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map(
                (row: { _key?: string; cells: string[] }, rowIndex: number) => (
                  <tr key={row._key ?? `row-${rowIndex}`}>
                    {row.cells.map((cell, cellIndex) => (
                      <td
                        className="border border-border px-4 py-3 align-top"
                        key={`${row._key ?? rowIndex}-${cellIndex}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      );
    },
    youtube: ({ value }) => {
      const videoId = getYouTubeVideoId(value.url);
      const fallbackHref = getSafeLinkHref(value.url);
      if (!videoId) {
        return fallbackHref ? (
          <p className="mb-4">
            <a
              className="font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary"
              href={fallbackHref}
              rel="noopener noreferrer"
              target="_blank"
            >
              Watch video
            </a>
          </p>
        ) : null;
      }

      return (
        <div className="my-8 aspect-video max-w-[45rem] overflow-hidden rounded-card">
          <YouTubeEmbed videoid={videoId} params="rel=0" />
        </div>
      );
    },
    iframeEmbed: ({ value }) => {
      const src = getSafeIframeSrc(value.src);
      if (!src) return null;

      return (
        <div className="my-8 overflow-hidden rounded-card bg-muted">
          <iframe
            allowFullScreen
            className="w-full"
            height={value.height ?? 450}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
            src={src}
            title={value.title || "Embedded content"}
          />
        </div>
      );
    },
  },
};

function createPostRichTextComponents(
  getHeadingId: GetHeadingId,
): PortableTextProps["components"] {
  return {
    ...richTextContentComponents,
    block: {
      ...richTextBlockComponents,
      ...createRichTextHeadingComponents(getHeadingId),
    },
  };
}

export default function RichTextContent({
  className,
  dataSanity,
  getHeadingId,
  value,
}: Readonly<{
  className?: string;
  dataSanity?: string;
  getHeadingId?: GetHeadingId;
  value: PortableTextProps["value"];
}>) {
  return (
    <div
      className={cn(
        "max-w-none text-base leading-7 text-foreground/80 [&>:first-child]:mt-0 [&>:last-child]:mb-0 [&_a]:font-medium [&_blockquote]:blockquote-accent [&_blockquote]:px-5 [&_blockquote]:py-3 [&_blockquote]:text-foreground [&_figcaption]:text-muted-foreground [&_h2]:mt-12 [&_h2]:border-b [&_h2]:border-border [&_h2]:pb-3 [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:tracking-normal [&_h3]:mt-10 [&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:tracking-normal [&_h4]:mt-8 [&_h4]:text-xl [&_h4]:font-semibold [&_li]:my-2 [&_ol]:my-6 [&_ol]:pl-6 [&_p]:my-5 [&_p]:text-pretty [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:my-6 [&_ul]:pl-6",
        className,
      )}
      data-sanity={dataSanity}
    >
      <PortableText
        components={
          getHeadingId
            ? createPostRichTextComponents(getHeadingId)
            : richTextContentComponents
        }
        value={value}
      />
    </div>
  );
}
