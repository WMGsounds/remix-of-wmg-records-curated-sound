import { notion, DBS, CACHE_HEADERS, logApiError, logApiFallback, logApiSuccess, validateNotionEnv, type ApiResponse } from "./_client.js";
import { FALLBACK_HEADERS, fallbackArtists } from "./_fallback.js";
import { loadAll, normalizeArtist } from "./_normalize.js";

export default async function handler(_req: unknown, res: ApiResponse) {
  const route = "/api/notion/artists";
  try {
    validateNotionEnv(route);
    const pages = await loadAll(notion, DBS.artists);
    const artists = pages
      .map(normalizeArtist)
      .sort((a, b) => (a.displayOrder - b.displayOrder) || a.name.localeCompare(b.name));
    logApiSuccess(route, { pageCount: pages.length, artistCount: artists.length });
    res.writeHead(200, CACHE_HEADERS).end(JSON.stringify(artists));
  } catch (e: unknown) {
    logApiError(route, e);
    logApiFallback(route, e, { fallbackArtistCount: fallbackArtists.length });
    res.writeHead(200, FALLBACK_HEADERS).end(JSON.stringify(fallbackArtists));
  }
}
