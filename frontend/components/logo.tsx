"use client";

import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { SETTINGS_QUERY_RESULT } from "@/sanity.types";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Logo({
  settings,
}: {
  settings: SETTINGS_QUERY_RESULT;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only render theme-dependent content after hydration
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Theme selection must wait until after hydration.
    setMounted(true);
  }, []);

  // During SSR or before hydration, use light theme as default
  const themeToUse = mounted ? resolvedTheme : "light";

  // Select the appropriate logo based on resolved theme (handles "system" correctly)
  const selectedLogo =
    settings?.logo?.[themeToUse === "dark" ? "dark" : "light"];

  // If no logo for the current theme, try the opposite theme as fallback
  const fallbackLogo =
    settings?.logo?.[themeToUse === "dark" ? "light" : "dark"];
  const logoToUse = selectedLogo || fallbackLogo;
  const label = settings?.siteName?.trim();

  if (!label) return null;

  return logoToUse ? (
    <Image
      src={urlFor(logoToUse).url()}
      alt={label}
      width={
        logoToUse?.asset?.metadata?.dimensions?.width ??
        100
      }
      height={
        logoToUse?.asset?.metadata?.dimensions?.height ??
        40
      }
      title={label}
      placeholder={
        logoToUse?.asset?.metadata?.lqip &&
        logoToUse?.asset?.mimeType !== "image/svg+xml"
          ? "blur"
          : undefined
      }
      blurDataURL={logoToUse?.asset?.metadata?.lqip || undefined}
      quality={100}
      priority
    />
  ) : (
    <span className="text-lg font-semibold tracking-tighter">
      {label}
    </span>
  );
}
