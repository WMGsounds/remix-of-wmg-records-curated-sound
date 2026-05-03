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
  JournalArticleSummary,
  JournalArticleData,
} from "./types";
import { getMockDataForPath } from "./mockData";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const ALLOW_MOCK_DATA = import.meta.env.DEV;

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const mock = getMockDataForPath(path);
    if (ALLOW_MOCK_DATA && mock !== null) {
      console.warn(`[cms-api] ${res.status} preview response for ${path}; using MOCK DATA.`);
      return mock as T;
    }
    throw new Error(`Request failed (${res.status}): ${path}`);
  }
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    // In the Lovable preview environment the Vercel /api/* serverless routes
    // are not running, so the SPA fallback returns index.html (or Vite returns
    // a raw TS module). Either way the response is not JSON — fall back to
    // mock data so the preview still renders the full layout.
    const mock = getMockDataForPath(path);
    if (ALLOW_MOCK_DATA && mock !== null) {
      const trimmed = text.trim().slice(0, 40);
      console.warn(
        `[cms-api] Non-JSON preview response for ${path} (starts with: ${trimmed}…); using MOCK DATA.`,
        error,
      );
      return mock as T;
    }
    throw error;
  }
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

export async function fetchJournal(): Promise<JournalArticleSummary[]> {
  return fetchJson<JournalArticleSummary[]>("/api/notion/journal");
}

export async function fetchJournalBySlug(slug: string): Promise<JournalArticleData | null> {
  return fetchJson<JournalArticleData | null>(
    `/api/notion/journal/${encodeURIComponent(slug)}`,
  );
}
