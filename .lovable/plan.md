## Add WMG Store (final — v5)

A new `/store` page powered by a new Notion **Store** database, sitting alongside (not replacing) Releases. One Notion row = one product card, with its own image, artist, formats and per-format prices.

### Notion (user action required)

Create the **Store** database in Notion yourself, then share it with the existing integration. Properties:

- `Store Item` (Title)
- `Store Slug` (Text)
- `Artist` (Relation → Artists, two-way, reverse: "Store Items") — required
- `Release` (Relation → Releases, two-way, reverse: "Store Items") — optional
- `Related Tracks` (Relation → Tracks, two-way, reverse: "Store Items") — optional
- `Format` (Multi-select: Vinyl, CD, iTunes, Digital, Merch, Other)
- `Purchase Link` (URL)
- `Product Image` (Files & media)
- `Store Description` (Text)
- `Display Price Summary` (Checkbox)
- `Price - Vinyl` / `Price - CD` / `Price - iTunes` / `Price - Digital` / `Price - Other` (Text)
- `Availability` (Select: Available Now, Coming Soon, Sold Out, Hidden)
- `Published` (Checkbox)
- `Featured` (Checkbox)
- `Store Sort Order` (Number)
- `Button Text` (Text)
- `Notes` (Text, internal)

Then set `NOTION_STORE_DB_ID` in env. Until then the page renders mock data in preview.

### Price summary computation (when `Display Price Summary === true`)

1. Map selected formats → price fields: `Vinyl → Price - Vinyl`, `CD → Price - CD`, `iTunes → Price - iTunes`, `Digital → Price - Digital`, `Merch | Other → Price - Other`.
2. Collect `{ format, raw }` only where `raw` is non-empty AND the format is in `formats`.
3. Parse first numeric token via `/-?\d+(?:[.,]\d+)?/` (comma → dot), `parseFloat`. Drop unparseable entries.
4. If none remain → `priceSummary = null`.
5. Otherwise pick lowest numeric. Build display from its `raw`:
   - starts with `From` (case-insensitive) → use `raw` as-is.
   - contains `£`/`$`/`€`/`¥` → `"From " + raw.trim()`.
   - else → `"From £" + raw.trim()`.
6. Computed in `normalizeStoreItem` so server + mocks share one source of truth.

### Backend (Vercel API)

- Add `storeItems` to `DBS` in `api/notion/_client.ts` (`NOTION_STORE_DB_ID`) and to `REQUIRED_ENV`.
- New route `api/notion/store.ts`:
  - Loads Store + Artists + Releases + Tracks in parallel via `loadAll`.
  - Builds artist, release, and track lookups (track lookup: `Map<id, { id, title }>`).
  - Normalizes each row → `StoreItem`.
  - Filters: `Published === true` AND `Availability !== "Hidden"`.
  - Sort: Featured first → `Store Sort Order` asc → `Store Item` alpha.
  - Returns JSON with `CACHE_HEADERS`; fallback to mock on error.
- New `normalizeStoreItem(page, { artistLookup, releaseLookup, trackLookup })` in `api/notion/_normalize.ts`:
  - Artist from direct `Artist` relation.
  - Image: `Product Image` → linked Release's `Cover Art` (verified property name) → `""`.
  - `slug` from `Store Slug` (null when empty).
  - `relatedTracks`: maps each `Related Tracks` relation id through `trackLookup` → `{ id, title }`, dropping unknown ids.
  - `displayPriceSummary` from checkbox; `priceSummary` per rules above.
- Fallback mock data in `api/notion/_fallback.ts` + `src/lib/mockData.ts`, including one item with `availability: "Available Now"`, `displayPriceSummary: true`, multiple prices producing visible `From £7.99`, and a populated `relatedTracks`.

### Shared types (`src/lib/types.ts`)

```ts
export type StoreFormat = "Vinyl" | "CD" | "iTunes" | "Digital" | "Merch" | "Other";
export type StoreAvailability = "Available Now" | "Coming Soon" | "Sold Out" | "Hidden";
export type StoreItem = {
  id: string;
  slug: string | null;
  title: string;
  artist: { id: string; slug: string; name: string } | null;
  release: { id: string; slug: string; title: string } | null;
  relatedTracks: { id: string; title: string }[];
  formats: StoreFormat[];
  prices: Partial<Record<StoreFormat, string>>;
  displayPriceSummary: boolean;
  priceSummary: string | null;
  purchaseLink: string | null;
  productImage: string;
  description: string;
  availability: StoreAvailability;
  featured: boolean;
  buttonText: string | null;
};
```

Plus `fetchStoreItems()` in `src/lib/api.ts` and `useStoreItems()` in `src/lib/queries.ts`.

### Frontend

- New page `src/pages/Store.tsx` (lazy in `src/App.tsx`, route `/store`).
- New component `src/components/StoreCard.tsx`.
- Nav: add `{ to: "/store", label: "Store" }` after Journal in `src/components/Layout.tsx` (header + footer Explore list).

**StoreCard** (dark, premium):
- Square `LazyImage`; `alt = "{title} by {artistName}"`.
- Title (serif), Artist (small caps gold), Description (muted).
- Status label uses raw Notion value: `Available Now`, `Coming Soon`, `Sold Out`.
- "Available in: Vinyl · CD · iTunes" (selected formats only).
- If `displayPriceSummary === true` AND `priceSummary` non-null → render `priceSummary` prominently above the per-format list.
- Per-format price list, only formats in `formats`:
  - price non-empty → `Vinyl: £24.99`
  - price empty → `Vinyl: See purchase page`
- Optional "Includes:" list when `relatedTracks.length > 0` — renders each track's title.
- Button logic:
  - `Available Now` + link → active, text = `Button Text` or "View Purchase Options", `target="_blank" rel="noopener noreferrer"`, small "Opens external purchase page" hint.
  - `Available Now` + no link → disabled, "Link Coming Soon".
  - `Coming Soon` → disabled, "Coming Soon".
  - `Sold Out` → disabled, "Sold Out".
  - `Hidden` → not rendered (filtered server-side, guarded client-side).
  - `aria-label`: "View purchase options for {title} by {artist}".

### SEO

- `<Seo>` on Store page with spec title/description.
- Add `/store` to `api/sitemap.ts`.

### Out of scope

- No cart, checkout, Shopify.
- Releases / Artists / Tracks / Release Tracks / Journal pages and DBs untouched (apart from the reverse "Store Items" relations you'll add in Notion).

### Files added / changed

- Add: `api/notion/store.ts`, `src/pages/Store.tsx`, `src/components/StoreCard.tsx`.
- Edit: `api/notion/_client.ts`, `api/notion/_normalize.ts`, `api/notion/_fallback.ts`, `src/lib/types.ts`, `src/lib/api.ts`, `src/lib/queries.ts`, `src/lib/mockData.ts`, `src/App.tsx`, `src/components/Layout.tsx`, `api/sitemap.ts`, `.env.example`.