import { createFooterModel } from "./model";
import { SiteFooter } from "./site-footer";
import { createDataAttribute } from "next-sanity";
import { fetchSanityFooter, fetchSanitySettings, getCurrentYear } from "@/sanity/lib/fetch";
import { getDynamicFetchOptions, type DynamicFetchOptions } from "@/sanity/lib/live";
import { dataset, projectId } from "@/sanity/lib/env";

export { SiteFooter } from "./site-footer";

function FooterUnavailable() {
  return (
    <footer data-footer-state="unavailable">
      Footer information is temporarily unavailable.
    </footer>
  );
}

export async function DynamicFooter() {
  const { perspective, stega } = await getDynamicFetchOptions();
  return <CachedFooter perspective={perspective} stega={stega} />;
}

export async function CachedFooter({ perspective, stega }: DynamicFetchOptions) {
  const [rawFooter, settings, year] = await Promise.all([
    fetchSanityFooter({ perspective, stega }),
    fetchSanitySettings({ perspective, stega }),
    getCurrentYear(),
  ]);
  const model = createFooterModel(rawFooter, settings, year);
  const dataAttribute = stega
    ? (path: string) =>
        createDataAttribute({
          baseUrl: process.env.NEXT_PUBLIC_STUDIO_URL || "http://localhost:3333",
          dataset,
          id: "footer",
          path,
          projectId,
          type: "footer",
        }).toString()
    : undefined;

  return model ? <SiteFooter dataAttribute={dataAttribute} model={model} /> : <FooterUnavailable />;
}
