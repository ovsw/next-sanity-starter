import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
// Shadcnblocks cta3: grouped post actions in a bordered call-to-action section.
import { buttonVariants } from "@/components/ui/button";
import { ChevronRight, ExternalLink, Mail, Phone } from "lucide-react";
import { stegaClean } from "next-sanity";
import Link from "next/link";
import { getSafeLinkHref } from "@/lib/safe-href";
import type { BlogPostSidebar, PostHeading } from "./model";
import { PostTableOfContents } from "./table-of-contents";

type Action = NonNullable<BlogPostSidebar["actions"]>[number];
type DataAttribute = (path: string) => string | undefined;

function getActionIcon(href: string, isInternal: boolean) {
  if (isInternal) return <ChevronRight aria-hidden="true" />;
  if (href.startsWith("tel:")) return <Phone aria-hidden="true" />;
  if (href.startsWith("mailto:")) return <Mail aria-hidden="true" />;
  return <ExternalLink aria-hidden="true" />;
}

/** Wraps children in the right element for the destination, preserving rel/target rules. */
function ActionLink({
  children,
  dataAttribute,
  href,
  openInNewTab,
  path,
}: {
  children: React.ReactNode;
  dataAttribute?: DataAttribute;
  href: string;
  openInNewTab: boolean;
  path: string;
}) {
  const isInternal = href.startsWith("/") && !href.startsWith("//");
  const isHttp = /^https?:\/\//i.test(href);
  const dataSanity = dataAttribute?.(`${path}.button.text`);

  return isInternal ? (
    <Link
      className={buttonVariants({ variant: "outline" })}
      data-sanity={dataSanity}
      href={href}
    >
      {children}
    </Link>
  ) : (
    <a
      className={buttonVariants({ variant: "outline" })}
      data-sanity={dataSanity}
      href={href}
      rel={isHttp && openInNewTab ? "noopener noreferrer" : undefined}
      target={isHttp && openInNewTab ? "_blank" : undefined}
    >
      {children}
    </a>
  );
}

function SidebarAction({
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
    <div className="space-y-4" data-sanity={dataAttribute?.(path)}>
      {action.description ? (
        <span
          className="block text-sm text-muted-foreground"
          data-sanity={dataAttribute?.(`${path}.description`)}
        >
          {action.description}{" "}
        </span>
      ) : null}
      <ActionLink
        dataAttribute={dataAttribute}
        href={href}
        openInNewTab={openInNewTab}
        path={path}
      >
        <span>{label}</span>
        {getActionIcon(href, isInternal)}
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
      className="container py-32"
      aria-label="Post actions"
      data-sanity={dataAttribute?.("actions")}
    >
      <div className="grid grid-cols-1 gap-10 rounded-lg border p-6 shadow-sm lg:grid-cols-2 lg:px-20 lg:py-16">
        {sidebar.title || sidebar.description ? (
          <header>
            {sidebar.title ? (
              <h2
                className="mb-2 text-2xl font-bold lg:text-4xl"
                data-sanity={dataAttribute?.("title")}
              >
                {sidebar.title}
              </h2>
            ) : null}
            {sidebar.description ? (
              <p
                className="text-muted-foreground"
                data-sanity={dataAttribute?.("description")}
              >
                {sidebar.description}
              </p>
            ) : null}
          </header>
        ) : null}
        <div className="flex flex-col gap-4">
          {[leadAction, ...restActions].map((action) => {
            if (!action) return null;
            const actionKey = stegaClean(action._key);
            const actionPath = `actions[_key=="${actionKey}"]`;

            return (
              <section className="rounded-xl border px-6 py-4" key={actionKey}>
                {action.title ? (
                  <h3
                    className="mb-2 font-medium"
                    data-sanity={dataAttribute?.(`${actionPath}.title`)}
                  >
                    {action.title}
                  </h3>
                ) : null}
                <SidebarAction
                  action={action}
                  dataAttribute={dataAttribute}
                  path={actionPath}
                />
              </section>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

// Shadcnblocks faq1 accordion structure used for the optional reading index.
export function PostTableOfContentsRail({
  headings,
}: {
  headings: PostHeading[];
}) {
  return (
    <aside className="mb-10" aria-label="Post table of contents">
      <Accordion type="single" collapsible defaultValue="contents">
        <AccordionItem value="contents">
          <AccordionTrigger className="font-semibold hover:no-underline">
            Table of contents
          </AccordionTrigger>
          <AccordionContent>
            <PostTableOfContents headings={headings} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </aside>
  );
}
