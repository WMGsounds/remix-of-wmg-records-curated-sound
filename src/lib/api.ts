// ============================================================================
//  CMS API LAYER
// ----------------------------------------------------------------------------
//  The frontend ONLY calls these helper functions. Never call Notion directly.
//
//  In development (and inside Lovable), USE_MOCKS = true returns local mock
//  data shaped EXACTLY like the production /api/notion/* responses.
//
//  After exporting to Vercel:
//    1. Set USE_MOCKS = false (or set VITE_USE_MOCKS="false" in Vercel env).
//    2. Add the serverless routes from README-NOTION.md to /api/notion/*.
//    3. Add NOTION_TOKEN, NOTION_ARTISTS_DB_ID, NOTION_RELEASES_DB_ID,
//       NOTION_TRACKS_DB_ID in the Vercel project environment variables.
//
//  No code in the frontend needs to change — these helpers will just start
//  hitting the real endpoints.
// ============================================================================

import type {
  Artist,
  Release,
  Track,
  HomepageData,
  ArtistPageData,
  ReleasePageData,
} from "./types";
import { mockArtists, mockReleases, mockTracks } from "./mockData";

const USE_MOCKS =
  (import.meta.env.VITE_USE_MOCKS ?? "true") !== "false";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

// Simulated network latency for mocks (so loading states are real)
const mockDelay = <T>(value: T, ms = 250): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}): ${path}`);
  }
  return (await res.json()) as T;
}

// ----------------------------------------------------------------------------
//  Public API — these names are stable. Vercel routes must match.
// ----------------------------------------------------------------------------

export async function fetchArtists(): Promise<Artist[]> {
  if (USE_MOCKS) {
    const sorted = [...mockArtists].sort((a, b) => a.displayOrder - b.displayOrder);
    return mockDelay(sorted);
  }
  return fetchJson<Artist[]>("/api/notion/artists");
}

export async function fetchReleases(): Promise<Release[]> {
  if (USE_MOCKS) {
    const sorted = [...mockReleases].sort(
      (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime(),
    );
    return mockDelay(sorted);
  }
  return fetchJson<Release[]>("/api/notion/releases");
}

export async function fetchTracks(): Promise<Track[]> {
  if (USE_MOCKS) return mockDelay([...mockTracks]);
  return fetchJson<Track[]>("/api/notion/tracks");
}

export async function fetchHomepageData(): Promise<HomepageData> {
  if (USE_MOCKS) {
    const featuredArtists = [...mockArtists]
      .filter((a) => a.featured)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .slice(0, 6);
    const latestReleases = [...mockReleases]
      .filter((r) => r.showOnHomepage)
      .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
      .slice(0, 6);
    const featuredRelease =
      [...mockReleases].find((r) => r.featured) ?? latestReleases[0] ?? null;
    return mockDelay({ featuredArtists, latestReleases, featuredRelease });
  }
  return fetchJson<HomepageData>("/api/notion/homepage");
}

export async function fetchArtistBySlug(slug: string): Promise<ArtistPageData | null> {
  if (USE_MOCKS) {
    const artist = mockArtists.find((a) => a.slug === slug);
    if (!artist) return mockDelay(null);
    const discography = mockReleases
      .filter((r) => r.artistSlug === slug)
      .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
    return mockDelay({ artist, discography });
  }
  return fetchJson<ArtistPageData | null>(
    `/api/notion/artist/${encodeURIComponent(slug)}`,
  );
}

export async function fetchReleaseBySlug(slug: string): Promise<ReleasePageData | null> {
  if (USE_MOCKS) {
    const release = mockReleases.find((r) => r.slug === slug);
    if (!release) return mockDelay(null);
    const artist = mockArtists.find((a) => a.slug === release.artistSlug) ?? null;
    const tracks = mockTracks
      .filter((t) => t.releaseSlug === slug)
      .sort((a, b) => a.trackNumber - b.trackNumber);
    const related = mockReleases
      .filter((r) => r.artistSlug === release.artistSlug && r.slug !== slug)
      .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
      .slice(0, 3);
    return mockDelay({ release, artist, tracks, related });
  }
  return fetchJson<ReleasePageData | null>(
    `/api/notion/release/${encodeURIComponent(slug)}`,
  );
}
