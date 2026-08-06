# Artist page Gallery preview

Add a Gallery preview section to every individual artist page, directly below the Journal section (currently the last section on the page), reusing the existing Gallery data, tiles and lightbox.

## What the section looks like

- Heading block matching the Store and Journal sections exactly: gold "Gallery" eyebrow, `display-serif` heading, same section padding, top border and content width.
- A single equal-column image row: up to 4 images on desktop, 3 on tablet, 2 on small screens, 1 on very narrow screens. Fixed 4:5 editorial aspect ratio, `object-cover`, focal point respected from the Gallery data, same subtle hover zoom / border treatment used on existing gallery tiles.
- Clicking a tile opens the existing `GalleryLightbox` component scoped to the previewed images — no new lightbox.
- Below the row, a centred "Visit the gallery" link styled identically to the existing "Visit the Store" link on the artist page, pointing to `/gallery?artist=<artist-slug>`.
- If the artist has no gallery images, the whole section (including the CTA) is not rendered. Fewer than four images simply render fewer columns' worth of tiles.

## Gallery page artist deep-link

The Gallery page currently keeps its artist filter in local state only. It will read an `artist` search param on load and keep the URL in sync when the filter changes, so arriving from an artist page pre-selects that artist while the "All Artists" option still returns to the full gallery. The filter key already uses artist slug (falling back to name), matching the artist-page link.

## Technical notes

- New reusable component `src/components/ArtistGalleryPreview.tsx`, used once in `src/pages/ArtistPage.tsx`; takes the artist and renders nothing when the filtered list is empty.
- Data comes from the existing `useGallery()` query and `/api/notion/gallery` — no API, Notion or type changes.
- Matching is by `artistSlug === artist.slug` first, falling back to `artistName === artist.name` only when the slug is absent; results are de-duplicated by image id.
- Ordering: featured images first, then existing `sortOrder`, then most recent `imageDate`/`publishDate`; take the first 4.
- Images lazy-load with `loading="lazy"`, `decoding="async"` and existing alt-text fields.
- `src/pages/Gallery.tsx` gains `useSearchParams` wiring for the artist filter only; all other filters, sorting and curation logic stay unchanged.
