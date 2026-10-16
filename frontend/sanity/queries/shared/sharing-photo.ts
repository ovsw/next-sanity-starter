// The photo on a generated sharing card: the Social sharing photo first, then
// the photo the page already leads with. A photo without an asset is skipped,
// so an emptied field falls through instead of blocking the next source.
const photoProjection = `{ asset, crop, hotspot }`;

/** Sites can add homeHero or innerHero blocks; the Starter has neither. */
export const pageSharingPhotoQuery = `"sharingPhoto": select(
  defined(meta.image.asset) => meta.image,
  blocks[_type in ["homeHero", "innerHero"] && defined(image.asset)][0].image
)${photoProjection}`;

/** Posts lead with their main image. */
export const postSharingPhotoQuery = `"sharingPhoto": select(
  defined(meta.image.asset) => meta.image,
  defined(image.asset) => image
)${photoProjection}`;

/** Archives have no hero, so only the Social sharing photo applies. */
export const archiveSharingPhotoQuery = `"sharingPhoto": select(
  defined(meta.image.asset) => meta.image
)${photoProjection}`;
