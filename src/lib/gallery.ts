import type { GalleryImage } from "./types";

/** CSS object-position for a Notion "Focal Point" value. */
export const objectPositionFor = (focalPoint: string): string => {
  switch ((focalPoint || "").toLowerCase()) {
    case "top":
      return "center top";
    case "bottom":
      return "center bottom";
    case "left":
      return "left center";
    case "right":
      return "right center";
    default:
      return "center";
  }
};

/**
 * Pick up to `count` images for the hero composition: featured records first
 * (in curated API order), then other published images to fill the gaps.
 */
export const pickHeroImages = (images: GalleryImage[], count = 3): GalleryImage[] => {
  const featured = images.filter((i) => i.featured);
  const rest = images.filter((i) => !i.featured);
  return [...featured, ...rest].slice(0, count);
};

/** Featured-first ordering that preserves the curated order inside each group. */
export const sortFeaturedFirst = (images: GalleryImage[]): GalleryImage[] => [
  ...images.filter((i) => i.featured),
  ...images.filter((i) => !i.featured),
];

/**
 * Decide which tiles get an enlarged (2-column) placement.
 * Deterministic: a featured tile is enlarged only when at least
 * `spacing` tiles have passed since the previous enlargement, so enlarged
 * tiles never sit directly beside one another and stay ~1 per 8-12 tiles.
 */
export const enlargedTileIds = (images: GalleryImage[], spacing = 9): Set<string> => {
  const out = new Set<string>();
  let last = -Infinity;
  images.forEach((image, index) => {
    if (!image.featured) return;
    // Very tall portraits become unwieldy when doubled in width.
    if (image.aspectRatio !== null && image.aspectRatio < 0.9) return;
    if (index - last < spacing) return;
    out.add(image.id);
    last = index;
  });
  return out;
};
