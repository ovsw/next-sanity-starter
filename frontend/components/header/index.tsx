import { createHeaderBrandModel, createHeaderNavigationModel } from "./model";
import { Header } from "./site-header";
import { fetchSanityNavigation, fetchSanitySettings } from "@/sanity/lib/fetch";
import { getDynamicFetchOptions, type DynamicFetchOptions } from "@/sanity/lib/live";
export { Header } from "./site-header";

function HeaderUnavailable() {
  return (
    <header data-header-state="unavailable">
      Site identity is unavailable.
    </header>
  );
}

export async function DynamicHeader() {
  const { perspective, stega } = await getDynamicFetchOptions();
  return <CachedHeader perspective={perspective} stega={stega} />;
}

export async function CachedHeader({ perspective, stega }: DynamicFetchOptions) {
  const [settings, rawNavigation] = await Promise.all([
    fetchSanitySettings({ perspective, stega }),
    fetchSanityNavigation({ perspective, stega }),
  ]);
  const brand = createHeaderBrandModel(settings);
  if (!brand) return <HeaderUnavailable />;

  const model = {
    brand,
    navigation: createHeaderNavigationModel(rawNavigation),
  };

  return <Header model={model} />;
}
