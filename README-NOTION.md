# WMG Records — Notion CMS Integration

This site pulls all artist, release, and track content from **Notion** via **Vercel
serverless API routes**. The Notion token never reaches the browser. The frontend
only ever calls internal endpoints under `/api/notion/*`.

---

## Architecture

```
┌──────────────────┐     fetch      ┌─────────────────────┐    Notion API   ┌─────────┐
│   React (Vite)   │ ─────────────▶ │  /api/notion/*      │ ──────────────▶ │ Notion  │
│  (this project)  │                │  Vercel serverless  │                 │   DBs   │
└──────────────────┘                └─────────────────────┘                 └─────────┘
        ▲                                     ▲
        │                                     │ reads NOTION_TOKEN +
        │ uses src/lib/api.ts                 │ NOTION_*_DB_ID from env
        │ (fetchArtists, fetchReleases, …)    │
        ▼
   Loading / empty / error states via React Query
```

**Frontend data layer**

All pages call the API helpers in `src/lib/api.ts`:

- `fetchArtists()`              → `GET /api/notion/artists`
- `fetchReleases()`             → `GET /api/notion/releases`
- `fetchTracks()`               → `GET /api/notion/tracks`
- `fetchHomepageData()`         → `GET /api/notion/homepage`
- `fetchArtistBySlug(slug)`     → `GET /api/notion/artist/[slug]`
- `fetchReleaseBySlug(slug)`    → `GET /api/notion/release/[slug]`

While running inside Lovable / locally, the helpers return mock data shaped exactly
like the production responses (see `src/lib/mockData.ts`). To switch them to live
Vercel endpoints, set the env var:

```
VITE_USE_MOCKS=false
```

The shared TypeScript shape lives in `src/lib/types.ts`. Your serverless routes
must return JSON matching this shape.

---

## Required Vercel environment variables

Add these in the Vercel project dashboard → **Settings → Environment Variables**:

| Name                     | Required | Notes                                                  |
|--------------------------|----------|--------------------------------------------------------|
| `NOTION_TOKEN`           | yes      | Notion internal integration token (`secret_…`)         |
| `NOTION_ARTISTS_DB_ID`   | yes      | 32-char Artists database ID                            |
| `NOTION_RELEASES_DB_ID`  | yes      | 32-char Releases database ID                           |
| `NOTION_TRACKS_DB_ID`    | yes      | 32-char Tracks database ID                             |
| `VITE_USE_MOCKS`         | yes      | Set to `false` in production                            |

> Get database IDs from the Notion URL: `notion.so/.../<32-char-id>?v=...`
> Make sure each database is **shared with your Notion integration**.

---

## Notion database schema (must match exactly)

### Artists DB
| Property            | Type             |
|---------------------|------------------|
| `Name`              | title            |
| `Slug`              | rich_text        |
| `Genre`             | select / text    |
| `Short Description` | rich_text        |
| `Full Bio`          | rich_text (multi-paragraph) |
| `Hero Image`        | files            |
| `Gallery`           | files (multiple) |
| `Featured`          | checkbox         |
| `Display Order`     | number           |
| `Accent Colour`     | rich_text        |

### Releases DB
| Property            | Type             |
|---------------------|------------------|
| `Title`             | title            |
| `Slug`              | rich_text        |
| `Artist`            | relation → Artists |
| `Release Date`      | date             |
| `Release Type`      | select (Single / EP / Album) |
| `Cover Art`         | files            |
| `Short Description` | rich_text        |
| `Full Description`  | rich_text        |
| `Featured`          | checkbox         |
| `Show on Homepage`  | checkbox         |
| `Spotify URL`       | url              |
| `Apple Music URL`   | url              |
| `Bandcamp URL`      | url              |
| `Tidal URL`         | url              |
| `YouTube URL`       | url              |
| `Catalogue ID`      | rich_text        |
| `Display Order`     | number           |

### Tracks DB
| Property        | Type            |
|-----------------|-----------------|
| `Track Title`   | title           |
| `Release`       | relation → Releases |
| `Track Number`  | number          |
| `Duration`      | rich_text (e.g. "3:42") |
| `Lyrics`        | rich_text       |

---

## Deploying the serverless routes

After exporting this project to GitHub and importing into Vercel, create the
following files at the root of the repo (Vercel auto-mounts anything in `/api`):

```
api/
  notion/
    _client.ts
    _normalize.ts
    artists.ts
    releases.ts
    tracks.ts
    homepage.ts
    artist/[slug].ts
    release/[slug].ts
```

Install the Notion SDK alongside the project:

```bash
npm install @notionhq/client
```

### `api/notion/_client.ts`

```ts
import { Client } from "@notionhq/client";

export const notion = new Client({ auth: process.env.NOTION_TOKEN });

export const DBS = {
  artists: process.env.NOTION_ARTISTS_DB_ID!,
  releases: process.env.NOTION_RELEASES_DB_ID!,
  tracks: process.env.NOTION_TRACKS_DB_ID!,
};

// Notion file URLs expire ~1h. Cache responses 50 min so we always re-fetch
// before the URL goes stale.
export const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=3000, stale-while-revalidate=600",
  "Content-Type": "application/json",
};
```

### `api/notion/_normalize.ts`

```ts
// Convert Notion property objects into the clean shape src/lib/types.ts expects.

const text = (p: any): string =>
  (p?.rich_text ?? p?.title ?? []).map((t: any) => t.plain_text).join("").trim();

const paragraphs = (p: any): string[] =>
  text(p).split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);

const num = (p: any): number => p?.number ?? 0;
const bool = (p: any): boolean => !!p?.checkbox;
const url = (p: any): string | undefined => p?.url ?? undefined;
const select = (p: any): string => p?.select?.name ?? "";
const date = (p: any): string => p?.date?.start ?? "";

const fileUrl = (f: any): string =>
  f?.type === "external" ? f.external.url : f?.file?.url ?? "";

const files = (p: any): string[] => (p?.files ?? []).map(fileUrl).filter(Boolean);
const firstFile = (p: any): string => files(p)[0] ?? "";

export function normalizeArtist(page: any) {
  const props = page.properties;
  return {
    id: page.id,
    slug: text(props["Slug"]),
    name: text(props["Name"]),
    genre: select(props["Genre"]) || text(props["Genre"]),
    shortDescription: text(props["Short Description"]),
    fullBio: paragraphs(props["Full Bio"]),
    heroImage: firstFile(props["Hero Image"]),
    gallery: files(props["Gallery"]),
    featured: bool(props["Featured"]),
    displayOrder: num(props["Display Order"]),
    accentColour: text(props["Accent Colour"]) || null,
  };
}

export function normalizeRelease(page: any, artistLookup: Map<string, any>) {
  const props = page.properties;
  const artistRel = props["Artist"]?.relation?.[0]?.id ?? "";
  const artist = artistLookup.get(artistRel);
  return {
    id: page.id,
    slug: text(props["Slug"]),
    title: text(props["Title"]),
    artistId: artistRel,
    artistSlug: artist?.slug ?? "",
    artistName: artist?.name ?? "",
    releaseDate: date(props["Release Date"]),
    releaseType: select(props["Release Type"]) || "Single",
    coverArt: firstFile(props["Cover Art"]),
    shortDescription: text(props["Short Description"]),
    fullDescription: text(props["Full Description"]),
    featured: bool(props["Featured"]),
    showOnHomepage: bool(props["Show on Homepage"]),
    streamingLinks: {
      spotify: url(props["Spotify URL"]),
      appleMusic: url(props["Apple Music URL"]),
      bandcamp: url(props["Bandcamp URL"]),
      tidal: url(props["Tidal URL"]),
      youtube: url(props["YouTube URL"]),
    },
    catalogueId: text(props["Catalogue ID"]) || null,
    displayOrder: num(props["Display Order"]),
  };
}

export function normalizeTrack(page: any, releaseLookup: Map<string, any>) {
  const props = page.properties;
  const releaseRel = props["Release"]?.relation?.[0]?.id ?? "";
  const release = releaseLookup.get(releaseRel);
  return {
    id: page.id,
    trackTitle: text(props["Track Title"]),
    releaseId: releaseRel,
    releaseSlug: release?.slug ?? "",
    trackNumber: num(props["Track Number"]),
    duration: text(props["Duration"]) || "",
    lyrics: text(props["Lyrics"]) || null,
  };
}

export async function loadAll(notion: any, dbId: string) {
  const results: any[] = [];
  let cursor: string | undefined;
  do {
    const r = await notion.databases.query({
      database_id: dbId,
      start_cursor: cursor,
      page_size: 100,
    });
    results.push(...r.results);
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return results;
}
```

### `api/notion/artists.ts`

```ts
import { notion, DBS, CACHE_HEADERS } from "./_client";
import { loadAll, normalizeArtist } from "./_normalize";

export default async function handler(_req: any, res: any) {
  try {
    const pages = await loadAll(notion, DBS.artists);
    const artists = pages
      .map(normalizeArtist)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    res.writeHead(200, CACHE_HEADERS).end(JSON.stringify(artists));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
```

### `api/notion/releases.ts`

```ts
import { notion, DBS, CACHE_HEADERS } from "./_client";
import { loadAll, normalizeArtist, normalizeRelease } from "./_normalize";

export default async function handler(_req: any, res: any) {
  try {
    const [artistPages, releasePages] = await Promise.all([
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases),
    ]);
    const artistLookup = new Map(
      artistPages.map((p) => [p.id, normalizeArtist(p)]),
    );
    const releases = releasePages
      .map((p) => normalizeRelease(p, artistLookup))
      .sort((a, b) => +new Date(b.releaseDate) - +new Date(a.releaseDate));
    res.writeHead(200, CACHE_HEADERS).end(JSON.stringify(releases));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
```

### `api/notion/tracks.ts`

```ts
import { notion, DBS, CACHE_HEADERS } from "./_client";
import { loadAll, normalizeRelease, normalizeArtist, normalizeTrack } from "./_normalize";

export default async function handler(_req: any, res: any) {
  try {
    const [artistPages, releasePages, trackPages] = await Promise.all([
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases),
      loadAll(notion, DBS.tracks),
    ]);
    const artistLookup = new Map(artistPages.map((p) => [p.id, normalizeArtist(p)]));
    const releaseLookup = new Map(
      releasePages.map((p) => [p.id, normalizeRelease(p, artistLookup)]),
    );
    const tracks = trackPages
      .map((p) => normalizeTrack(p, releaseLookup))
      .sort((a, b) => a.trackNumber - b.trackNumber);
    res.writeHead(200, CACHE_HEADERS).end(JSON.stringify(tracks));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
```

### `api/notion/homepage.ts`

```ts
import { notion, DBS, CACHE_HEADERS } from "./_client";
import { loadAll, normalizeArtist, normalizeRelease } from "./_normalize";

export default async function handler(_req: any, res: any) {
  try {
    const [artistPages, releasePages] = await Promise.all([
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases),
    ]);
    const artists = artistPages.map(normalizeArtist);
    const artistLookup = new Map(artists.map((a) => [a.id, a]));
    const releases = releasePages.map((p) => normalizeRelease(p, artistLookup));

    const featuredArtists = artists
      .filter((a) => a.featured)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .slice(0, 6);

    const latestReleases = releases
      .filter((r) => r.showOnHomepage)
      .sort((a, b) => +new Date(b.releaseDate) - +new Date(a.releaseDate))
      .slice(0, 6);

    const featuredRelease = releases.find((r) => r.featured) ?? latestReleases[0] ?? null;

    res.writeHead(200, CACHE_HEADERS).end(
      JSON.stringify({ featuredArtists, latestReleases, featuredRelease }),
    );
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
```

### `api/notion/artist/[slug].ts`

```ts
import { notion, DBS, CACHE_HEADERS } from "../_client";
import { loadAll, normalizeArtist, normalizeRelease } from "../_normalize";

export default async function handler(req: any, res: any) {
  const { slug } = req.query;
  try {
    const [artistPages, releasePages] = await Promise.all([
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases),
    ]);
    const artists = artistPages.map(normalizeArtist);
    const artist = artists.find((a) => a.slug === slug);
    if (!artist) return res.status(404).json(null);

    const artistLookup = new Map(artists.map((a) => [a.id, a]));
    const discography = releasePages
      .map((p) => normalizeRelease(p, artistLookup))
      .filter((r) => r.artistSlug === slug)
      .sort((a, b) => +new Date(b.releaseDate) - +new Date(a.releaseDate));

    res.writeHead(200, CACHE_HEADERS).end(JSON.stringify({ artist, discography }));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
```

### `api/notion/release/[slug].ts`

```ts
import { notion, DBS, CACHE_HEADERS } from "../_client";
import { loadAll, normalizeArtist, normalizeRelease, normalizeTrack } from "../_normalize";

export default async function handler(req: any, res: any) {
  const { slug } = req.query;
  try {
    const [artistPages, releasePages, trackPages] = await Promise.all([
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases),
      loadAll(notion, DBS.tracks),
    ]);
    const artists = artistPages.map(normalizeArtist);
    const artistLookup = new Map(artists.map((a) => [a.id, a]));
    const releases = releasePages.map((p) => normalizeRelease(p, artistLookup));
    const release = releases.find((r) => r.slug === slug);
    if (!release) return res.status(404).json(null);

    const releaseLookup = new Map(releases.map((r) => [r.id, r]));
    const tracks = trackPages
      .map((p) => normalizeTrack(p, releaseLookup))
      .filter((t) => t.releaseSlug === slug)
      .sort((a, b) => a.trackNumber - b.trackNumber);

    const artist = artists.find((a) => a.id === release.artistId) ?? null;
    const related = releases
      .filter((r) => r.artistSlug === release.artistSlug && r.slug !== slug)
      .sort((a, b) => +new Date(b.releaseDate) - +new Date(a.releaseDate))
      .slice(0, 3);

    res.writeHead(200, CACHE_HEADERS).end(
      JSON.stringify({ release, artist, tracks, related }),
    );
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
```

---

## Deploy checklist

1. Export this project to GitHub and import into Vercel.
2. `npm install @notionhq/client` at the project root.
3. Create the `/api/notion/*` files above.
4. In Notion: open each database → **`···` menu → Add connections** → select your integration so it can read the data.
5. Add the env vars listed above in **Vercel → Settings → Environment Variables**.
6. Set `VITE_USE_MOCKS=false` for Production (and Preview if you want live data there too).
7. Deploy. Visit `/api/notion/artists` to confirm a JSON response — then load the site.

---

## Future-proofing for Shopify

The data layer is already structured to make adding a Shopify-driven shop trivial:

- Add a `Product` type alongside `Release` in `src/lib/types.ts`.
- Add `fetchProducts()` / `fetchProductsByRelease(slug)` in `src/lib/api.ts`,
  pointing at `/api/shopify/products` (Vercel route, same pattern).
- Add a `productSlug?: string` field to `Release` in Notion to link a release to a product.
- Drop a `<ShopSection />` into `ReleasePage.tsx` rendered when a product exists.
- Add `/shop` route + cart icon in `Layout.tsx`.

No refactor required — the page components already consume normalized data via hooks.
