import Blocks from "@/components/blocks";
import FaqPageJsonLd from "@/components/faq-json-ld";
import VideoJsonLd from "@/components/video-json-ld";
import WebsiteJsonLd from "@/components/website-json-ld";
import { siteUrl } from "@/lib/site-url";
import { fetchHomePage } from "@/sanity/lib/fetch";
import { generatePageMetadata } from "@/sanity/lib/metadata";
import MissingSanityPage from "@/components/ui/missing-sanity-page";
import {
  getDynamicFetchOptions,
  sanityFetchMetadata,
  type DynamicFetchOptions,
} from "@/sanity/lib/live";
import { HOME_PAGE_QUERY_RESULT } from "@/sanity.types";
import { HOME_PAGE_QUERY } from "@/sanity/queries/home-page";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { stegaClean } from "next-sanity";

export async function generateMetadata() {
  const { data: page } = (await sanityFetchMetadata({
    query: HOME_PAGE_QUERY,
    perspective: "published",
  })) as { data: HOME_PAGE_QUERY_RESULT };

  return generatePageMetadata({ page, path: "/" });
}

export default async function IndexPage() {
  const { isEnabled: isDraftMode } = await draftMode();

  if (isDraftMode) {
    return <DynamicIndexPage />;
  }

  return <CachedIndexPage perspective="published" stega={false} />;
}

async function DynamicIndexPage() {
  const { perspective, stega } = await getDynamicFetchOptions();
  return <CachedIndexPage perspective={perspective} stega={stega} />;
}

async function CachedIndexPage({ perspective, stega }: DynamicFetchOptions) {
  const page = await fetchHomePage({ perspective, stega });

  if (!page) {
    if (perspective === "published") notFound();
    return MissingSanityPage({ document: "homePage", documentId: "homePage" });
  }

  const hasLeadingHero = page.blocks?.[0]?._type === "hero";

  return (
    <>
      <WebsiteJsonLd siteUrl={siteUrl} />
      <FaqPageJsonLd blocks={page.blocks ?? []} />
      <VideoJsonLd content={page.blocks ?? []} />
      {!hasLeadingHero && stegaClean(page.title)?.trim() ? (
        <header>
          <h1>{page.title}</h1>
          {stegaClean(page.description)?.trim() ? (
            <p>{page.description}</p>
          ) : null}
        </header>
      ) : null}
      <Blocks
        blocks={page.blocks ?? []}
        documentId={page._id}
        documentType="homePage"
        perspective={perspective}
        stega={stega}
      />
    </>
  );
}
