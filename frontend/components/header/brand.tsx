import Image from "next/image";
import type { HeaderBrandModel, HeaderLogoModel } from "./model";

function Logo({
  alt,
  logo,
}: {
  alt: string;
  logo: HeaderLogoModel;
}) {
  return (
    <Image
      alt={alt}
      height={logo.height}
      priority
      src={logo.src}
      width={logo.width}
    />
  );
}

export function HeaderBrand({ brand }: { brand: HeaderBrandModel }) {
  if (!brand.light && !brand.dark) {
    return <span>{brand.label}</span>;
  }

  const logo = brand.light ?? brand.dark;
  return logo ? <Logo alt={brand.label} logo={logo} /> : null;
}
