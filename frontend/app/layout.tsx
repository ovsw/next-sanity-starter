import type { Metadata } from "next";
import { Archivo, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/site-url";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SITE_NAME, TITLE_SUFFIX } from "../../shared/seo-title";

const isProduction = process.env.NEXT_PUBLIC_SITE_ENV === "production";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: `%s${TITLE_SUFFIX}`,
    default: SITE_NAME,
  },
  openGraph: {
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/images/og-image.jpg`,
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  robots: !isProduction ? "noindex, nofollow" : "index, follow",
};

const fontDisplay = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-phx-display",
  display: "swap",
});

const fontBody = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-phx-body",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      className={cn(fontDisplay.variable, fontBody.variable)}
      data-scroll-behavior="smooth"
      lang="en"
      suppressHydrationWarning
    >
      <link rel="icon" href="/favicon.ico" />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased overscroll-none",
        )}
      >
        {/* Light-only for launch; see docs/adr/0001-light-theme-only-for-launch.md
            to re-enable dark mode (swap forcedTheme for the commented props). */}
        <ThemeProvider
          attribute="class"
          forcedTheme="light"
          // defaultTheme="system"
          // enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
