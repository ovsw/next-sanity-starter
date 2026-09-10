"use client";

// Shadcnblocks navbar1. The existing model owns safe destinations.
import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { HeaderBrand } from "./brand";
import { HeaderLink } from "./header-link";
import type { HeaderModel, HeaderNavigationModel } from "./model";
import { NavigationIcon } from "./navigation-icon";

export function HeaderNavigation({
  navigation,
}: {
  navigation: HeaderNavigationModel;
}) {
  return (
    <nav aria-label="Main navigation" className="flex items-center gap-6">
      <NavigationMenu>
        <NavigationMenuList>
          {navigation.items.map((item) => (
            <NavigationMenuItem key={item.key}>
              {item.kind === "link" ? (
                <NavigationMenuLink asChild>
                  <HeaderLink
                    className="rounded-md px-4 py-2 text-sm font-medium hover:bg-accent"
                    link={item.link}
                  />
                </NavigationMenuLink>
              ) : (
                <>
                  <NavigationMenuTrigger>{item.label}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="w-80 space-y-1 p-3">
                      {item.links.map((child) => (
                        <li key={child.key}>
                          <NavigationMenuLink asChild>
                            <HeaderLink
                              className="flex gap-3 rounded-md p-3 hover:bg-accent"
                              link={child.link}
                            >
                              {child.icon && (
                                <NavigationIcon icon={child.icon} />
                              )}
                              <span>
                                <span className="block text-sm font-medium">
                                  {child.label}
                                </span>
                                {child.description && (
                                  <span className="mt-1 block text-sm text-muted-foreground">
                                    {child.description}
                                  </span>
                                )}
                              </span>
                            </HeaderLink>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </>
              )}
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
      <div className="flex gap-2">
        {navigation.actions.map((action) => (
          <Button asChild size="compact" key={action.key}>
            <HeaderLink link={action.link} />
          </Button>
        ))}
      </div>
    </nav>
  );
}

export function Header({ model }: { model: HeaderModel }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="border-b py-4">
      <div className="container">
        <div className="hidden items-center justify-between gap-6 lg:flex">
          <Link
            className="flex items-center gap-2 text-lg font-semibold tracking-tight"
            aria-label={`${model.brand.label} home page`}
            href="/"
          >
            <HeaderBrand brand={model.brand} />
          </Link>
          <HeaderNavigation navigation={model.navigation} />
        </div>
        <div className="flex items-center justify-between lg:hidden">
          <Link
            className="text-lg font-semibold"
            aria-label={`${model.brand.label} home page`}
            href="/"
          >
            <HeaderBrand brand={model.brand} />
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Open navigation"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{model.brand.label}</SheetTitle>
                <SheetDescription className="sr-only">
                  Website navigation
                </SheetDescription>
              </SheetHeader>
              <nav
                aria-label="Mobile navigation"
                className="flex flex-col gap-6 p-4"
              >
                <Accordion type="single" collapsible>
                  {model.navigation.items.map((item) =>
                    item.kind === "link" ? (
                      <HeaderLink
                        className="block py-3 font-semibold"
                        key={item.key}
                        link={item.link}
                        onClick={() => setOpen(false)}
                      />
                    ) : (
                      <AccordionItem value={item.key} key={item.key}>
                        <AccordionTrigger>{item.label}</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            {item.links.map((child) => (
                              <HeaderLink
                                className="block"
                                key={child.key}
                                link={child.link}
                                onClick={() => setOpen(false)}
                              >
                                <span className="font-medium">
                                  {child.label}
                                </span>
                                {child.description && (
                                  <span className="mt-1 block text-sm text-muted-foreground">
                                    {child.description}
                                  </span>
                                )}
                              </HeaderLink>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ),
                  )}
                </Accordion>
                <div className="flex flex-col gap-3">
                  {model.navigation.actions.map((action) => (
                    <Button asChild key={action.key}>
                      <HeaderLink
                        link={action.link}
                        onClick={() => setOpen(false)}
                      />
                    </Button>
                  ))}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
