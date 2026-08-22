import { CachedHeader, DynamicHeader } from "@/components/header";
import { CachedFooter, DynamicFooter } from "@/components/footer";
import { DisableDraftMode } from "@/components/disable-draft-mode";
import PersonJsonLd from "@/components/person-json-ld";
import { VisualEditing } from "next-sanity/visual-editing";
import { draftMode } from "next/headers";
import { siteUrl } from "@/lib/site-url";
import { SanityLive } from "@/sanity/lib/live";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isEnabled: isDraftMode } = await draftMode();

  return (
    <>
      {isDraftMode ? (
        <DynamicHeader />
      ) : (
        <CachedHeader perspective="published" stega={false} />
      )}
      <main>{children}</main>
      <SanityLive includeDrafts={isDraftMode} />
      {isDraftMode && (
        <>
          <DisableDraftMode />
          <VisualEditing />
        </>
      )}
      <PersonJsonLd siteUrl={siteUrl} />
      {isDraftMode ? (
        <DynamicFooter />
      ) : (
        <CachedFooter perspective="published" stega={false} />
      )}
    </>
  );
}
