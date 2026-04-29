// ============================================================================
//  CMS API LAYER
// ----------------------------------------------------------------------------
//  The frontend ONLY calls these helper functions. Never call Notion directly.
//
//  The frontend ONLY calls the Vercel /api/notion/* routes. Never call Notion
//  directly from browser code.
// ============================================================================

import type {
  Artist,
  Release,
  Track,
  HomepageData,
  ArtistPageData,
  ReleasePageData,
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

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
  return fetchJson<Artist[]>("/api/notion/artists");
}

export async function fetchReleases(): Promise<Release[]> {
  return fetchJson<Release[]>("/api/notion/releases");
}

export async function fetchTracks(): Promise<Track[]> {
  return fetchJson<Track[]>("/api/notion/tracks");
}

export async function fetchHomepageData(): Promise<HomepageData> {
  return fetchJson<HomepageData>("/api/notion/homepage");
}

export async function fetchArtistBySlug(slug: string): Promise<ArtistPageData | null> {
  return fetchJson<ArtistPageData | null>(
    `/api/notion/artist/${encodeURIComponent(slug)}`,
  );
}

export async function fetchReleaseBySlug(slug: string): Promise<ReleasePageData | null> {
  return fetchJson<ReleasePageData | null>(
    `/api/notion/release/${encodeURIComponent(slug)}`,
  );
}
