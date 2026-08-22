import { ChevronRight, ExternalLink, Mail, Phone } from "lucide-react";
import { stegaClean } from "next-sanity";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSafeLinkHref } from "@/lib/safe-href";
import type { BlogPostSidebar, PostHeading } from "./model";
import { PostTableOfContents } from "./table-of-contents";

type Action = NonNullable<BlogPostSidebar["actions"]>[number];
type DataAttribute = (path: string) => string | undefined;

/*
 * The rail is a margin note, not a stack of cards. The first action carries the
 * solid teal button because it is the one the post is steering toward; every
 * later action is a quiet text link. Emphasis comes from that ordering.
 */
function getActionIcon(href: string, isInternal: boolean) {
  if (isInternal) return <ChevronRight aria-hidden="true" />;
  if (href.startsWith("tel:")) return <Phone aria-hidden="true" />;
  if (href.startsWith("mailto:")) return <Mail aria-hidden="true" />;
  return <ExternalLink aria-hidden="true" />;
}

/** Wraps children in the right element for the destination, preserving rel/target rules. */
function ActionLink({
  children,
  className,
  dataAttribute,
  href,
  openInNewTab,
  path,
}: {
  children: React.ReactNode;
  className?: string;
  dataAttribute?: DataAttribute;
  href: string;
  openInNewTab: boolean;
  path: string;
}) {
  const isInternal = href.startsWith("/") && !href.startsWith("//");
  const isHttp = /^https?:\/\//i.test(href);
  const dataSanity = dataAttribute?.(`${path}.button.text`);

  return isInternal ? (
    <Link className={className} data-sanity={dataSanity} href={href}>
      {children}
    </Link>
  ) : (
    <a
      className={className}
      data-sanity={dataSanity}
      href={href}
      rel={isHttp && openInNewTab ? "noopener noreferrer" : undefined}
      target={isHttp && openInNewTab ? "_blank" : undefined}
    >
      {children}
    </a>
  );
}

/** The lead action: the single solid button in the rail. */
function PrimaryAction({
  action,
  dataAttribute,
  path,
}: {
  action: Action;
  dataAttribute?: DataAttribute;
  path: string;
}) {
  const href = getSafeLinkHref("href" in action ? action.href : null);
  const label = "text" in action ? action.text : null;
  if (!href || !label) return null;

  const isInternal = href.startsWith("/") && !href.startsWith("//");
  const openInNewTab =
    "openInNewTab" in action && stegaClean(action.openInNewTab) === true;

  return (
    <div className="space-y-2" data-sanity={dataAttribute?.(path)}>
      {action.description ? (
        <p
          className="typo-body-sm text-muted-foreground"
          data-sanity={dataAttribute?.(`${path}.description`)}
        >
          {action.description}
        </p>
      ) : null}
      <Button
        asChild
        className="h-auto min-h-11 w-full justify-between whitespace-normal py-2.5 text-left"
        variant="default"
      >
        <ActionLink
          dataAttribute={dataAttribute}
          href={href}
          openInNewTab={openInNewTab}
          path={path}
        >
          <span>{label}</span>
          {getActionIcon(href, isInternal)}
        </ActionLink>
      </Button>
    </div>
  );
}

/** Every action after the lead: a teal text link over its supporting line. */
function SecondaryAction({
  action,
  dataAttribute,
  path,
}: {
  action: Action;
  dataAttribute?: DataAttribute;
  path: string;
}) {
  const href = getSafeLinkHref("href" in action ? action.href : null);
  const label = "text" in action ? action.text : null;
  if (!href || !label) return null;

  const isInternal = href.startsWith("/") && !href.startsWith("//");
  const openInNewTab =
    "openInNewTab" in action && stegaClean(action.openInNewTab) === true;

  return (
    <div data-sanity={dataAttribute?.(path)}>
      {action.description ? (
        <p
          className="typo-body-sm text-muted-foreground"
          data-sanity={dataAttribute?.(`${path}.description`)}
        >
          {action.description}
        </p>
      ) : null}
      <ActionLink
        className="group/action inline-flex min-h-11 items-center gap-1.5 py-1 font-semibold text-primary underline-offset-4 transition-colors motion-fast hover:underline focus-underline"
        dataAttribute={dataAttribute}
        href={href}
        openInNewTab={openInNewTab}
        path={path}
      >
        <span>{label}</span>
        <span className="transition-transform motion-fast group-hover/action:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover/action:translate-x-0">
          {getActionIcon(href, isInternal)}
        </span>
      </ActionLink>
    </div>
  );
}

export function PostSidebar({
  dataAttribute,
  sidebar,
}: {
  dataAttribute?: DataAttribute;
  sidebar: BlogPostSidebar | null;
}) {
  const actions = sidebar?.actions ?? [];
  if (!sidebar || actions.length === 0) return null;

  const [leadAction, ...restActions] = actions;

  return (
    <aside
      aria-label="Post contact options"
      className="min-w-0 self-stretch"
      data-sanity={dataAttribute?.("actions")}
    >
      {/* A hairline rule opens the rail instead of a box closing it in. */}
      <div className="border-t border-border pt-5 lg:sticky lg:top-24">
        {sidebar.title || sidebar.description ? (
          <header className="space-y-2">
            {sidebar.title ? (
              <h2
                className="typo-card-title text-foreground"
                data-sanity={dataAttribute?.("title")}
              >
                {sidebar.title}
              </h2>
            ) : null}
            {sidebar.description ? (
              <p
                className="typo-body-sm text-muted-foreground"
                data-sanity={dataAttribute?.("description")}
              >
                {sidebar.description}
              </p>
            ) : null}
          </header>
        ) : null}
        <div className="mt-5 space-y-5">
          {leadAction
            ? (() => {
                const actionKey = stegaClean(leadAction._key);
                const actionPath = `actions[_key=="${actionKey}"]`;
                return (
                  <section key={actionKey}>
                    {leadAction.title ? (
                      <h3
                        className="typo-body-sm mb-2 font-semibold text-foreground"
                        data-sanity={dataAttribute?.(`${actionPath}.title`)}
                      >
                        {leadAction.title}
                      </h3>
                    ) : null}
                    <PrimaryAction
                      action={leadAction}
                      dataAttribute={dataAttribute}
                      path={actionPath}
                    />
                  </section>
                );
              })()
            : null}
          {restActions.length ? (
            <div className="space-y-4 border-t border-border pt-5">
              {restActions.map((action) => {
                const actionKey = stegaClean(action._key);
                const actionPath = `actions[_key=="${actionKey}"]`;

                return (
                  <section key={actionKey}>
                    {action.title ? (
                      <h3
                        className="typo-body-sm font-semibold text-foreground"
                        data-sanity={dataAttribute?.(`${actionPath}.title`)}
                      >
                        {action.title}
                      </h3>
                    ) : null}
                    <SecondaryAction
                      action={action}
                      dataAttribute={dataAttribute}
                      path={actionPath}
                    />
                  </section>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

/*
 * A borderless margin index. No card, no shadow: the label sits above a hairline
 * and the headings read as quiet marginalia beside the article. The `details`
 * element is kept for the collapse affordance and the existing test contract.
 */
export function PostTableOfContentsRail({ headings }: { headings: PostHeading[] }) {
  return (
    <aside
      aria-label="Post table of contents"
      className="hidden min-w-0 self-stretch lg:block"
    >
      <div className="sticky top-24 border-t border-border pt-5">
        <details className="group" open>
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-sm typo-meta-label text-muted-foreground transition-colors motion-fast hover:text-foreground focus-underline [&::-webkit-details-marker]:hidden">
            <span>Table of Contents</span>
          </summary>
          <div className="mt-4">
            <PostTableOfContents headings={headings} />
          </div>
        </details>
      </div>
    </aside>
  );
}
