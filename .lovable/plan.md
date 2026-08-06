# Media navigation + Videos page

Add a `Media` dropdown to the main navigation (Gallery + Videos) and build a new `/videos` page populated from the YouTube link fields already stored in the Tracks Notion database.

## 1. Navigation

`src/components/Layout.tsx`

- Replace the `Gallery` nav entry with a `Media` group in the same position, containing `Gallery` (`/gallery`) and `Videos` (`/videos`).
- Desktop: a real `<button>` with `aria-expanded` / `aria-controls`, opening on hover and click, matching the existing header typography, borders, gold accents and transitions. `Media` shows the active (gold, bold) state on `/gallery` and `/videos`; the current child is highlighted inside the panel.
- Escape closes; outside click and focus-leaving close; visible keyboard focus preserved.
- Mobile: `Media` expands in place to reveal both links, touch and keyboard driven, reusing the existing serif mobile-menu styling.
- Footer: `Media` heading is not needed — list `Gallery` and `Videos` as separate links in the existing Explore list, in Journal → Gallery → Videos order.
- No other nav item, styling or header structure changes.

## 2. Data (no new Notion database)

`api/notion/_normalize.ts` + the tracks handler in `api/notion/artists.ts`

- Read `YouTube OA`, `YouTube OLV`, `YouTube OMV` from the Tracks database page (with the release-track pivot fallback already used for other track metadata) and expose them on each track.
- Also expose `artistName`, `artistSlug` and the release date on each track (currently absent) so the Videos page can filter and sort without a second join.
- Existing visibility rules stay authoritative: the tracks route already filters through `isReleasePublished`, so scheduled/hidden releases never produce videos.
- Extend `Track` in `src/lib/types.ts` with the optional YouTube fields, artist fields and release date. Add matching mock tracks in `src/lib/mockData.ts` so the Lovable preview renders.

## 3. Video item derivation (frontend, `src/lib/videos.ts`)

- `extractYouTubeId(url)` handles `watch?v=`, `youtu.be/`, `/shorts/`, `/embed/`, extra query params; returns `null` for anything that isn't an 11-char YouTube ID.
- `buildVideoItems(tracks)` produces up to three entries per track: `{ id: "<track-id>-omv|-olv|-oa", trackId, trackTitle, artistName, artistSlug, url, videoId, type, label, date }`.
- Labels: Official Music Video / Official Lyric Video / Official Audio.
- Invalid or empty URLs are skipped silently (no blank cards).
- Duplicate `videoId` collapses to one entry with priority OMV > OLV > OA; duplicates are `console.warn`-logged in dev only.

## 4. `/videos` page

`src/pages/Videos.tsx`, registered as a lazy route in `src/App.tsx`.

- Header block matching Gallery's structure and spacing, no hero image: eyebrow `MEDIA`, `display-serif` heading `Videos`, intro copy as specified, same `container-editorial` width and dark background.
- Filter bar reuses `FilterField`, `SearchInput` and the Gallery select styling: Artist (All Artists + artists present in results, keyed by slug), Video Type (All Videos / the three types), Search, Sort by (Random default, plus Newest, Artist, Title).
- Card grid (responsive 1/2/3 columns) using the YouTube thumbnail (`i.ytimg.com/vi/<id>/hqdefault.jpg`) with a gold play affordance, track title, artist name and type label — same restrained hover/border treatment as gallery tiles.
- Clicking a card opens a modal player that mounts a validated `youtube-nocookie.com/embed/<id>` iframe built only from the extracted ID, with Escape/backdrop close and prev/next navigation, styled like `GalleryLightbox`.
- `Show more` batching of 24, matching the Gallery control exactly.
- SEO: `Seo` component with title `Videos`, canonical `/videos`, breadcrumb JSON-LD; add `/videos` to `api/sitemap.ts`.

## 5. Stable random order

Extend `src/lib/galleryOrder.ts` (or a sibling helper) with a Europe/London daily seed. The seed is `londonDate + artistFilter + typeFilter`, held in state so the order is stable across re-renders, playback, filter-state UI changes and `Show more`, and refreshes on a new London calendar day. No `Math.random()` during render.

## Assumptions

- Videos open in an in-page modal player rather than navigating to YouTube.
- Thumbnails come from YouTube's public image CDN; no artwork needs storing in Notion.
