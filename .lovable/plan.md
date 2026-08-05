# Gallery section for WMG

A new `/gallery` page: editorial masonry archive driven by the existing Notion "Gallery Images" database, using the site's current hero, filter-bar and typography language.

## 1. Make room for a new API route

The project already sits on Vercel's Hobby limit of 12 serverless functions, so a 13th would break the deploy.

- Merge the two simplest list routes into one function: `api/notion/artists.ts` gains a `?dataset=tracks` mode; `api/notion/tracks.ts` is deleted.
- `vercel.json` gets a rewrite `/api/notion/tracks` → `/api/notion/artists?dataset=tracks`, so the public URL and the frontend `fetchTracks()` call are unchanged.
- The freed slot is used by the new `api/notion/gallery.ts`. Count stays at 12.

## 2. Secure Gallery endpoint

New `api/notion/gallery.ts`, following the existing route conventions (`_client.ts`, `loadAll`, `_schedule.ts`, cache-header constants):

- Reads `NOTION_TOKEN` and `NOTION_GALLERY_DATABASE_ID` server-side only; never reaches browser code.
- Filters strictly, failing closed: `Show on Website` checked AND `Image` file present AND (`Publish Date` empty OR reached, resolved with the existing DST-aware Europe/London helper).
- Normalises properties into a stable shape (`id, galleryId, title, imageUrl, width, height, aspectRatio, artistName, artistSlug, imageType, caption, altText, credit, imageDate, publishDate, featured, sortOrder, focalPoint, relatedRelease, relatedReleaseUrl`), handling empty rollups/relations/rich text safely.
- Deduplicates on Gallery ID, falling back to File Hash.
- Notion S3 file URLs are wrapped with the existing `/api/image-proxy` helper so expiring URLs are never treated as permanent.
- Cache headers matched to the URL lifetime (short `s-maxage` with revalidation) so expired image URLs never linger.
- Errors log server-side detail and return a generic error to the client. Hidden records never appear in any payload.

Frontend access goes through `src/lib/api.ts` (`fetchGallery`) and a `useGallery` hook in `src/lib/queries.ts`. A dev-only mock set is added to `src/lib/mockData.ts` so the Lovable preview can show the layout; it is never used in production.

## 3. Route and navigation

- `/gallery` route in `src/App.tsx` (lazy loaded, like Journal/Store).
- Gallery added between Releases and Journal in the desktop nav, mobile menu and footer (`src/components/Layout.tsx`), and to `api/sitemap.ts`. No other nav items change.

## 4. Hero

`src/pages/Gallery.tsx` reuses the Artists/Releases hero construction: ink background, editorial container, matching spacing, two-column desktop layout, gold eyebrow "THE VISUAL ARCHIVE", serif "Gallery" heading, the supplied intro line, gold/golden-brown radial lighting, grid texture, vignette, gold lower border, right visual hidden below `md`.

Right column: three published Featured images (portrait + landscape + small square) in a restrained overlapping composition with hairline antique-gold borders and mask fades. Falls back to other published images, then omits the collage entirely if nothing is published. Hero images carry empty alt text.

## 5. Controls

Same bordered control bar as Releases, using `FilterBar` components, with left group (Artist, Image Type) and right group (Search, Sort):

- Artist — options built from published records (name label, slug value), alphabetical, default "All Artists".
- Image Type — only types present in the data, default "All Images".
- Search "Search gallery" across title, artist, caption and related release, using the shared `src/lib/search.ts` helpers.
- Sort — Featured, Newest, Oldest, Artist Name; default ordering respects valid Sort Order values with a stable fallback.
- All state synced to the URL (`?artist=`, `?type=`, `?q=`, `?sort=`), parameters removed when cleared; refresh and back/forward restore the view.

## 6. Masonry and tiles

A small `src/components/GalleryGrid.tsx` doing shortest-column packing with known aspect ratios (4 / 3 / 2 / 1 columns by breakpoint, 24px desktop and ~14px mobile gaps). Natural aspect ratios preserved, no cropping, space reserved from stored Width/Height so there is no layout shift, and clean recalculation after filtering.

Featured or panoramic images may span two columns on desktop, throttled to roughly one in ten items and disabled on mobile and when the proportions are unsuitable.

Tiles: no card background, subtle gold/ivory hairline border, ~1.02 hover scale, dark gradient hover overlay with small uppercase gold artist name, ivory serif title/caption and a discreet "View image" cue, plus clear keyboard focus styling. Alt text comes from the record, with a cautious metadata-derived fallback.

## 7. Lightbox

`src/components/GalleryLightbox.tsx` — full-screen, near-black backdrop, image at original proportions, artist, caption, credit, related release link, prev/next, close, and position indicator (e.g. 4 / 28). Arrow-key navigation, Escape to close, swipe on touch, focus trap, focus returned to the originating tile, browser back closes the lightbox first, sequence follows the current filtered/sorted list, filter changes close it safely, `prefers-reduced-motion` respected, no download control.

## 8. Loading, empty and error states

- Initial 24 items on desktop / 16 on mobile with an understated "Load more images"; filters preserved, no duplicates, scroll position kept when the lightbox closes.
- Aspect-ratio skeletons derived from stored dimensions; lazy loading below the fold; only the first visible images prioritised; new batches announced politely for assistive tech.
- Empty state (expected while everything is unpublished): "The visual archive is being curated." with the supplied body copy, no developer or Notion terminology.
- A genuine fetch failure shows a distinct restrained retry state.

## 9. SEO

Via the existing `Seo` component: title `Gallery | Wareham Music Group`, the supplied meta description, canonical `/gallery`, Open Graph tags, and `CollectionPage`/`ImageGallery` structured data built only from published records. Sitemap entry added.

## Technical notes

- Files added: `api/notion/gallery.ts`, `src/pages/Gallery.tsx`, `src/components/GalleryGrid.tsx`, `src/components/GalleryLightbox.tsx`.
- Files changed: `api/notion/artists.ts` (tracks mode), `api/notion/tracks.ts` (deleted), `vercel.json`, `api/sitemap.ts`, `src/App.tsx`, `src/components/Layout.tsx`, `src/lib/types.ts`, `src/lib/api.ts`, `src/lib/queries.ts`, `src/lib/mockData.ts`, `.env.example`.
- No Notion content is created, changed or published; no other pages are touched.

## Environment variables you must set in Vercel

- `NOTION_GALLERY_DATABASE_ID` = `338c9b34bba347d4b2042348e5d79ed3`
- `NOTION_GALLERY_DATA_SOURCE_ID` = `7a64aeff-7407-4665-b550-20e775abcfcb` (only if the SDK path needs it)
- `NOTION_TOKEN` already exists; the integration must be shared with the Gallery Images database.

Until those are set and records are published, `/gallery` shows the curated empty state in production.
