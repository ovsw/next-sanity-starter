"use client";

import { X } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { HeaderLink } from "./header-link";
import type { HeaderNavigationModel } from "./model";
import { NavigationIcon } from "./navigation-icon";

const mobileLinkClassName =
  "flex min-h-11 items-center rounded-control px-3 typo-nav transition-colors motion-fast hover:bg-secondary hover:text-foreground focus-ring";

/**
 * Three bars that morph into an X while the sheet is open.
 *
 * The sheet's overlay covers this button, so the open-state X is mostly hidden
 * behind it — the visible payoff is the transition itself on open and on close,
 * plus the fallback if the overlay ever goes transparent. The bars are spans
 * rather than swapped lucide icons so the strokes travel between the two states
 * instead of one icon popping out and another popping in.
 */
function HamburgerIcon({ open }: { open: boolean }) {
  const bar = "h-[1.5px] w-full origin-center rounded-full bg-foreground transition-all motion-base";
  return (
    <span aria-hidden="true" className="flex w-3.5 flex-col gap-1">
      <span className={cn(bar, open && "translate-y-[5.5px] rotate-45")} />
      <span className={cn(bar, open && "scale-x-0 opacity-0")} />
      <span className={cn(bar, open && "-translate-y-[5.5px] -rotate-45")} />
    </span>
  );
}

export default function MobileNav({
  brand,
  navigation,
}: {
  brand: ReactNode;
  navigation: HeaderNavigationModel;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button aria-label={open ? "Close menu" : "Open menu"} size="icon" variant="ghost">
          <HamburgerIcon open={open} />
        </Button>
      </SheetTrigger>
      {/*
        The panel has to clear the side-by-side brand, which needs ~311px plus
        the close button and this row's padding. SheetContent ships its own
        `sm:max-w-sm`, which capped the panel at 384px from 640px up and left
        the lockup running under the close button; `!max-w-md` overrides it,
        since both are single-class selectors and the later-sorted `sm:` would
        otherwise win. max-w-none below `xs` keeps the full-width panel the
        stacked tier already relies on.
      */}
      <SheetContent
        className="!w-full !max-w-none xs:!max-w-md gap-0 border-l border-border/80 bg-background px-0"
        showCloseButton={false}
        style={{ width: "100%" }}
      >
        <SheetHeader className="flex-row items-center justify-between border-b border-border/80 px-6 py-6">
          {/*
            No max-width: the brand is now two marks in a row, and a 160px cap
            squeezed them well below their intended size. The close button is
            the only thing sharing this row, so min-w-0 plus the row's own gap
            is enough to keep them from colliding.
          */}
          <div className="flex min-w-0 items-center">{brand}</div>
          <SheetTitle className="sr-only">Main navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Browse primary destinations and mortgage resources.
          </SheetDescription>
          <SheetClose className="rounded-control p-2 text-muted-foreground transition-colors motion-fast hover:bg-secondary hover:text-foreground focus-ring">
            <X aria-hidden="true" className="size-5" />
            <span className="sr-only">Close</span>
          </SheetClose>
        </SheetHeader>
        <nav aria-label="Main navigation" className="grid flex-1 content-start gap-1 overflow-y-auto px-3 py-4">
          <Accordion collapsible type="single">
            {navigation.items.map((item) =>
              item.kind === "link" ? (
                <HeaderLink className={mobileLinkClassName} key={item.key} link={item.link} onClick={close} />
              ) : (
                <AccordionItem className="border-b-0" key={item.key} value={item.key}>
                  <AccordionTrigger className="min-h-11 items-center rounded-control px-3 py-2 typo-nav hover:bg-secondary hover:no-underline [&>svg]:translate-y-0">
                    {item.label}
                  </AccordionTrigger>
                  <AccordionContent>
                    {/*
                      No rail and no indent: the chips already mark these as
                      child items, so a border-l plus an indent on top of them
                      states the same hierarchy three times. Flush with the
                      trigger also keeps the chip column aligned with the group
                      labels rather than floating at its own offset.
                    */}
                    <div className="grid gap-1">
                      {item.links.map((child) => (
                        <HeaderLink
                          className="flex min-h-11 items-start gap-3 rounded-control p-3 transition-colors motion-fast hover:bg-secondary focus-ring"
                          key={child.key}
                          link={child.link}
                          onClick={close}
                        >
                          {/*
                            Keep the smaller fixed holder for alignment, but
                            match the sheet surface so it remains invisible.
                          */}
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-control bg-background text-primary">
                            <NavigationIcon icon={child.icon} />
                          </span>
                          <span className="grid gap-1">
                            <span className="typo-nav font-semibold leading-tight text-foreground">
                              {child.label}
                            </span>
                            {/*
                              leading-tight for the same reason as the desktop
                              panel: typo-fine-print's 1.6 line-height leaves
                              more space between two wrapped description lines
                              than between the description and its own label,
                              which reads as two unrelated rows.
                            */}
                            <span className="typo-fine-print leading-tight text-muted-foreground">
                              {child.description}
                            </span>
                          </span>
                        </HeaderLink>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ),
            )}
          </Accordion>
        </nav>
        {navigation.actions.length ? (
          <SheetFooter className="border-t border-border/80 p-4">
            {navigation.actions.map((action, index) => (
              <HeaderLink
                className={cn(
                  buttonVariants({
                    size: "compact",
                    variant: index === 1 ? "outline" : "primary",
                  }),
                  "w-full",
                )}
                key={action.key}
                link={action.link}
                onClick={close}
              />
            ))}
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
