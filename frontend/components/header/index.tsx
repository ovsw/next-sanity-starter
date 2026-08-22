import { createHeaderBrandModel, createHeaderNavigationModel } from "./model";
import { Header, HeaderNavigation } from "./site-header";
import type { HeaderNavigationModel } from "./model";
import { fetchSanityNavigation, fetchSanitySettings } from "@/sanity/lib/fetch";
import { getDynamicFetchOptions, type DynamicFetchOptions } from "@/sanity/lib/live";
export { Header } from "./site-header";

function HeaderUnavailable({ navigation }: { navigation: HeaderNavigationModel }) {
  return (
    <header data-header-state="unavailable">
      <p>Site identity is unavailable.</p>
      <HeaderNavigation navigation={navigation} />
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
  const navigation = createHeaderNavigationModel(rawNavigation);
  const brand = createHeaderBrandModel(settings);
  if (!brand) return <HeaderUnavailable navigation={navigation} />;

  const model = {
    brand,
    navigation,
  };

  return <Header model={model} />;
}
