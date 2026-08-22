export function requireStudioDataset(value: string | undefined) {
  const dataset = value?.trim();

  if (!dataset) {
    throw new Error(
      "SANITY_STUDIO_DATASET is required. Set it before starting or building Sanity Studio.",
    );
  }

  return dataset;
}
