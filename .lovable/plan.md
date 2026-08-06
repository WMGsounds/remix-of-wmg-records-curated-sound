# Artist page Gallery preview: editorial strip

Replace the four identical 4:5 portrait cards with a relaxed, mixed-proportion gallery strip that reuses the main Gallery page's aspect-ratio logic.

## What changes

- Each tile renders at its own aspect ratio (`image.aspectRatio`, falling back to 3/4 when Notion has no dimensions) — the same rule the main Gallery grid uses. No more forced 4:5 cropping.
- Desktop: a single justified row of up to four images. Tile widths are proportional to each image's aspect ratio, so landscape images get more width and portraits less, all sharing a common row height inside the existing content width.
- Slight vertical offsets are applied to alternating tiles so the row reads as a casual editorial composition rather than a flush-edged grid.
- Tablet: three-column layout; small screens: two columns; very narrow: one column. Tiles keep their native proportions at every breakpoint (column-based layout, so heights vary naturally).
- Selection logic is untouched: featured first, then `sortOrder`, then most recent `imageDate`/`publishDate`, take the first four regardless of orientation.

## Preserved

Heading block, section padding/border/width, focal-point positioning, hover zoom and border treatment, lazy loading and alt text, the existing `GalleryLightbox` wiring and indexes, the centred "Visit the gallery" link, artist filtering/deep-links, and hiding the section when the artist has no images.

## Technical notes

- Only `src/components/ArtistGalleryPreview.tsx` changes.
- Desktop row uses flex with `flex-grow` weighted by each image's aspect ratio and a shared row height, mirroring `GalleryGrid`'s `aspectRatio` styling on the inner wrapper.
- Vertical rhythm via a small deterministic `translate-y` per index (no randomness), applied only at the desktop breakpoint.
- Smaller breakpoints reuse the round-robin column approach from `GalleryGrid` so both areas share one visual system.
