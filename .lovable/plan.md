# Centralised structured data for WMG

All JSON-LD moves into one shared module with a generator per content type. Pages stop building schema by hand. Then the seven corrections are applied inside those generators, so they hold for every future page automatically.

## 1. New shared schema module (`src/lib/schema.ts`)

One exported generator per content type, each taking a content item and returning the JSON-LD object:

`musicAlbum`, `musicRecording`, `musicGroup`, `blogPosting`, `videoObject`, `product`, `itemList`, `breadcrumbList`, plus `organization` and `website`.

Supporting pieces in the same module:

- `absoluteUrl()` — prefixes `https://www.wmgsounds.com`, strips query strings (including `?v=` cache-busters) and trims whitespace. Every URL that enters any schema goes through it. The existing `absoluteUrl` in `src/lib/seo.ts` becomes a re-export of this one so there is a single implementation.
- `schemaFor(type, item)` — the single entry point pages use. If a content type has no generator it **throws**, which fails the pre-render build rather than silently shipping a page with no schema.

`product` is written now but not wired into the Store page (Product/Offer work is a later prompt).

## 2. Corrections applied inside the generators

**Organization** (emitted once, from the root layout only):
- `sameAs`: the three verbatim direct profile URLs (Instagram, YouTube, Spotify user) — no vanity redirects on our own domain, no invented Facebook/Apple entries.
- `email: info@wmgsounds.com`
- `genre: ["Soul","R&B","Blues","Reggae","Country"]`
- No `foundingDate` (none supplied).

**WebSite** — name and url only. No `potentialAction` SearchAction: Google retired the Sitelinks Search Box on 21 November 2024, so it produces no rich result.

**Duplicate homepage blocks** — Organization and WebSite move out of `<Seo>`/`seoConfig` into the root layout, so no page can emit them. The current homepage emits four blocks; the cause is not yet confirmed (a single emitter exists in `Seo.tsx`, so it is likely pre-rendered HTML plus a client-side re-injection). First step of the work is to reproduce and confirm the cause in the built output, then verify the layout-only change reduces the homepage to exactly one Organization and one WebSite.

**Releases** — the type is decided by actual track count, not the `releaseType` label:
- more than one track → `MusicAlbum` with a `track` array of `MusicRecording` items
- exactly one track → bare `MusicRecording`, no `track` array

Both carry `byArtist`, `genre`, `datePublished`, `duration` and `"inLanguage": "en-GB"`, plus a `sameAs` array built from the release's existing platform URLs (Spotify, Apple Music, YouTube Music, Amazon Music) so new releases inherit it. The `<html lang>` attribute changes from `en` to `en-GB` at the same time, so schema, `og:locale` and `lang` all agree.

**Artists (`MusicGroup`)** — `sameAs` built from the eight artist URL fields in this order, blanks skipped silently, `sameAs` omitted entirely when all eight are blank, never an empty string, never a label-level fallback:

Spotify, Apple Music, YouTube, YouTube Music, Amazon Music, Instagram, Facebook, TikTok.

`Store - Artist URL` is excluded (storefront, not identity) but stays available for the later Product work. Instagram, Facebook and TikTok are not currently read from Notion, so the artist normaliser gains those three fields.

**Images** — all image URLs in schema become absolute with `?v=` stripped, via `absoluteUrl()`.

**BreadcrumbList** — the shared SEO component attaches it automatically on every route except the homepage, instead of each page opting in.

**ItemList** — `/artists`, `/releases`, `/journal` and `/videos` each get an ItemList whose entries derive from the same content array the page renders, so new items appear automatically.

## 3. Visible social links

- **Footer**: Instagram, YouTube and Spotify links using the same three URLs, with accessible labels and matching the existing footer styling.
- **Artist pages**: a link row rendering the same non-blank artist URLs used in `sameAs`, with accessible labels. This extends the existing "Listen & Watch" row (`ArtistLinks.tsx`) with Instagram, Facebook and TikTok.

## 4. New `/search` page

A real site-wide search at `/search?q=…` covering artists, releases, journal articles, videos and store items, built on the existing shared search helpers. It is URL-addressable (the query lives in the URL), gets metadata from the central SEO config, is pre-rendered and appears in the sitemap through the existing automatic route discovery.

## Technical notes

- `src/lib/seo.ts` keeps constants and title/description helpers; all JSON-LD construction leaves it for `src/lib/schema.ts`.
- `src/components/Seo.tsx` calls only `schemaFor` and the automatic breadcrumb; it no longer accepts hand-built JSON-LD objects from pages.
- Inline JSON-LD is removed from `ArtistPage.tsx`, `ReleasePage.tsx` and `JournalArticlePage.tsx`.
- A pre-render build assertion checks each rendered page for: exactly one Organization and one WebSite site-wide (homepage only), a BreadcrumbList on every non-home route, and no relative or query-string URL anywhere inside JSON-LD. The build fails if any is violated.
- Verification: full local build, then a scan of the rendered HTML reporting per-route schema types and any assertion failures.
