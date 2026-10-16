import {
  createImageUrlBuilder,
  type SanityImageSource,
} from "@sanity/image-url";
import { dataset, projectId } from "./env";

// https://www.sanity.io/docs/image-url
const builder = createImageUrlBuilder({ projectId, dataset });

export const urlFor = (source: SanityImageSource) => {
  const imageBuilder = builder.image(source);

  // Check if it's an object with asset property that has mimeType
  const sourceObj = source as { asset?: { mimeType?: string } };
  const isSvg = sourceObj?.asset?.mimeType === "image/svg+xml";

  if (isSvg) {
    return imageBuilder;
  }

  return imageBuilder.format("webp").fit("crop");
};

// JPEG is supported by the sharing-card renderer. Preserve the crop and hotspot.
export function sharingCardPhotoUrl(source?: SanityImageSource | null) {
  if (!source) return undefined;
  return builder
    .image(source)
    .width(1200)
    .height(630)
    .fit("crop")
    .format("jpg")
    .url();
}
