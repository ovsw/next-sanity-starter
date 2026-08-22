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
      quality={100}
      src={logo.src}
      width={logo.width}
    />
  );
}

export function HeaderBrand({ brand }: { brand: HeaderBrandModel }) {
  if (!brand.light && !brand.dark) {
    return <span>{brand.label}</span>;
  }

  return <Logo alt={brand.label} logo={brand.light ?? brand.dark!} />;
}
