"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/utils";
import { HeaderLink } from "./header-link";
import type { HeaderChildLinkModel, HeaderNavigationItem, HeaderNavigationModel } from "./model";
import { NavigationIcon } from "./navigation-icon";

const primaryLinkClassName =
  "flex min-h-11 items-center whitespace-nowrap rounded-control px-1 typo-nav text-foreground transition-colors motion-fast hover:text-primary focus-ring";

// Wide enough that the longest description we ship ("Learn when Private
// Mortgage Insurance (PMI) may apply.") wraps to two lines instead of being
// clipped. Deliberately a fixed width rather than navbar14's content-sizing:
// the panel animates its width between groups, so a per-group width would make
// the follow-along resize on every hover.
const PANEL_WIDTH = 380;
const CLOSE_DELAY_MS = 120;

/** Panel geometry, measured relative to the nav element. */
type PanelPlacement = {
  /** Left edge of the panel, in px from the nav's left edge. */
  x: number;
  width: number;
  /** null until the content has been measured; the panel falls back to "auto". */
  height: number | null;
};

type ActiveGroup = {
  key: string;
  /** Keyboard/touch opens without motion; only pointer hover animates. */
  animate: boolean;
};

function GroupPanelContent({ label, links }: { label: string; links: HeaderChildLinkModel[] }) {
  return (
    <div className="p-3">
      {/*
        Eyebrow naming the open group. The trigger it belongs to is already
        highlighted above, but once the panel slides away from that trigger the
        label is what keeps the panel self-identifying.
      */}
      <p className="mb-2 px-2 typo-fine-print uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="grid gap-1">
        {links.map((child) => (
          <HeaderLink
            className="group/nav-link flex items-start gap-3 rounded-control px-2 py-2.5 transition-colors motion-fast hover:bg-secondary focus-ring"
            key={child.key}
            link={child.link}
          >
            {/*
              Keep the fixed holder for alignment, but let it disappear into
              the panel surface so the icon does not read as a separate chip.
            */}
            <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-popover text-primary transition-colors motion-fast group-hover/nav-link:bg-secondary group-focus-visible/nav-link:bg-secondary">
              <NavigationIcon className="size-5" icon={child.icon} />
            </span>
            <span className="grid gap-1">
              <span className="flex items-center gap-0.5 typo-nav font-semibold text-popover-foreground">
                {child.label}
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-primary opacity-0 transition-all motion-fast group-hover/nav-link:translate-x-0.5 group-hover/nav-link:opacity-100"
                />
              </span>
              {/*
                leading-tight overrides typo-fine-print's 1.6. At 13px that token
                leaves ~7.8px between wrapped lines — more than the gap to the
                label above — so a two-line description reads as two separate
                rows. Tightening it keeps the description a single visual block
                sitting under its label.
              */}
              <span className="typo-fine-print leading-tight text-muted-foreground">
                {child.description}
              </span>
            </span>
          </HeaderLink>
        ))}
      </div>
    </div>
  );
}

export default function DesktopNav({ navigation }: { navigation: HeaderNavigationModel }) {
  const [active, setActive] = useState<ActiveGroup | null>(null);
  const [placement, setPlacement] = useState<PanelPlacement | null>(null);
  /** True once the panel has been positioned at least once, so the first open fades in place. */
  const hasPlacement = useRef(false);

  const navRef = useRef<HTMLElement>(null);
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());
  // A state-backed callback ref, not useRef: under AnimatePresence mode="wait"
  // the incoming content mounts *after* the effect runs, so a useRef would have
  // the measure effect observing the outgoing node — every group would then
  // inherit the first group's height. Storing the node in state re-runs the
  // effect when it actually changes.
  const [contentNode, setContentNode] = useState<HTMLDivElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const panelIdBase = useId();

  const groups = useMemo(
    () =>
      navigation.items.filter(
        (item): item is Extract<HeaderNavigationItem, { kind: "group" }> => item.kind === "group",
      ),
    [navigation.items],
  );
  const activeItem = groups.find((group) => group.key === active?.key) ?? null;

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);

  const openGroup = useCallback(
    (key: string, animate: boolean) => {
      cancelClose();
      setActive((current) => {
        if (current?.key === key) return current;
        // Moving between triggers animates; the first open of a cold panel does not.
        return { key, animate: animate && hasPlacement.current };
      });
    },
    [cancelClose],
  );

  const closeGroup = useCallback(() => {
    cancelClose();
    setActive(null);
  }, [cancelClose]);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setActive(null), CLOSE_DELAY_MS);
  }, [cancelClose]);

  useEffect(() => cancelClose, [cancelClose]);

  // Measure the active trigger and its content, then place the shared panel.
  // jsdom reports zeros here; the panel still renders, it just sits at the origin.
  useLayoutEffect(() => {
    if (!active) {
      hasPlacement.current = false;
      return;
    }

    const nav = navRef.current;
    const trigger = triggerRefs.current.get(active.key);
    if (!nav || !trigger) return;

    const measure = () => {
      const navBox = nav.getBoundingClientRect();
      const triggerBox = trigger.getBoundingClientRect();
      const width = PANEL_WIDTH;
      // 0 means unmeasured, not "no content": jsdom reports zeros, and so does a
      // backgrounded tab. Animating the panel to height 0 collapses it to an
      // invisible strip with its links spilling out over the page, so an
      // unmeasured panel falls back to "auto" instead.
      const measured = contentNode?.offsetHeight ?? 0;
      const height = measured > 0 ? measured : null;

      const triggerCenter = triggerBox.left - navBox.left + triggerBox.width / 2;
      const maxX = Math.max(0, navBox.width - width);
      const x = Math.min(Math.max(triggerCenter - width / 2, 0), maxX);

      setPlacement((current) =>
        current && current.x === x && current.width === width && current.height === height
          ? current
          : { height, width, x },
      );
      hasPlacement.current = true;
    };

    measure();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    if (contentNode) observer.observe(contentNode);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [active, contentNode]);

  const onBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) closeGroup();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape" && active) {
      event.preventDefault();
      const trigger = triggerRefs.current.get(active.key);
      closeGroup();
      trigger?.focus();
    }
  };

  /** Sliding between triggers animates; a cold open lands in place. */
  const animated = Boolean(active?.animate) && !prefersReducedMotion;
  /** Morph transition for the panel's x and height. */
  const morph = animated
    ? { damping: 30, mass: 0.6, stiffness: 380, type: "spring" as const }
    : { duration: 0 };
  /** The fade always runs, otherwise a cold open would render at opacity 0. */
  const fade = { duration: prefersReducedMotion ? 0 : 0.14 };

  return (
    <nav
      aria-label="Main navigation"
      className="relative hidden items-center gap-3 xl:flex 2xl:gap-6"
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onMouseLeave={scheduleClose}
      ref={navRef}
    >
      {navigation.items.map((item) => {
        if (item.kind !== "group") {
          return <HeaderLink className={primaryLinkClassName} key={item.key} link={item.link} />;
        }

        const isActive = active?.key === item.key;
        return (
          <button
            aria-controls={isActive ? panelIdBase : undefined}
            aria-expanded={isActive}
            className={cn(
              primaryLinkClassName,
              // Wider than the shared px-1 so the active background reads as a
              // deliberate pill rather than a tight smudge around the label.
              "gap-1 px-2.5",
              // The open group is denoted by background rather than a caret, in the
              // panel's own surface colour so the trigger and the panel below it
              // read as one continuous shape. bg-popover is deliberately the same
              // token the panel uses, not a matching literal, so the two cannot
              // drift apart across themes.
              //
              // Not bg-secondary: that token is cream, and so is the header, so the
              // pill measured 1.04:1 against its own backdrop and disappeared. The
              // panel's links get away with it only because they sit on the popover.
              //
              // hover:text-primary has to be overridden rather than merely followed:
              // an open trigger is by definition the hovered one, and the teal label
              // is what the closed triggers use, so leaving it would blur the very
              // distinction this background exists to draw.
              isActive &&
                "bg-popover text-popover-foreground shadow-menu-layer hover:text-popover-foreground",
            )}
            key={item.key}
            onClick={(event) => {
              // Who opened the panel decides whether a click may close it.
              //
              // On mouse, hover already opened it, so a click that toggles
              // would close the panel the moment the user reaches for it.
              // On touch and keyboard there is no hover, so the click is the
              // only way in — and therefore has to be the way out too.
              //
              // pointerType is read per event rather than from a (hover: hover)
              // media query: a touchscreen laptop answers yes to that query and
              // still sends taps. event.detail === 0 means keyboard activation
              // (Enter/Space), which reports no pointerType at all.
              const pointerType = (event.nativeEvent as PointerEvent).pointerType;
              const canToggle =
                event.detail === 0 || pointerType === "touch" || pointerType === "pen";

              if (canToggle && isActive) closeGroup();
              else openGroup(item.key, false);
            }}
            onMouseEnter={() => openGroup(item.key, true)}
            ref={(node) => {
              if (node) triggerRefs.current.set(item.key, node);
              else triggerRefs.current.delete(item.key);
            }}
            type="button"
          >
            {item.label}
            <ChevronDown
              aria-hidden="true"
              className={cn("size-3 transition-transform motion-fast", isActive && "rotate-180")}
            />
          </button>
        );
      })}

      {/*
        A single persistent panel. Keying this element per group would remount it
        and restart the animation from scratch, which is what kills the follow-along.

        Position comes from motion's inline `x`, not `-translate-x-1/2`, so the
        reduced-motion guard in globals.css (which zeroes named lift utilities)
        never touches this placement. Reduced motion is handled in JS instead:
        `prefersReducedMotion` collapses every duration to zero.
      */}
      <AnimatePresence>
        {activeItem ? (
          <motion.div
            animate={{
              opacity: 1,
              x: placement?.x ?? 0,
              y: 0,
            }}
            /*
              The gap to the trigger is padding on the positioned wrapper, not a
              margin, so it stays inside the panel's hover target: the pointer
              travelling from trigger to panel never crosses dead space that
              would schedule a close.
            */
            className="absolute left-0 top-full z-[70] pt-1.5"
            exit={{ opacity: 0, transition: fade, y: -4 }}
            id={panelIdBase}
            initial={{ opacity: 0, x: placement?.x ?? 0, y: -4 }}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            style={{ width: PANEL_WIDTH }}
            transition={{ opacity: fade, x: morph, y: fade }}
          >
            <motion.div
              animate={{ height: placement?.height ?? "auto" }}
              /*
                rounded-control, not rounded-card: at 14px the card radius reads
                as a soft tile rather than a menu, and it dwarfs the 8px chips
                inside it. 8px keeps the panel and its contents on one radius.
              */
              className="relative overflow-hidden rounded-control border border-border bg-popover text-popover-foreground shadow-menu-layer dark:shadow-[0_18px_44px_rgba(0,0,0,0.28)]"
              initial={false}
              transition={morph}
            >
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  initial={{ opacity: animated ? 0 : 1 }}
                  key={activeItem.key}
                  ref={setContentNode}
                  transition={{ duration: prefersReducedMotion || !animated ? 0 : 0.16 }}
                >
                  <GroupPanelContent label={activeItem.label} links={activeItem.links} />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </nav>
  );
}
