import { notion, DBS, CACHE_HEADERS, logApiError, validateNotionEnv, type ApiResponse } from "./_client.js";
import { loadAll, normalizeArtist } from "./_normalize.js";

export default async function handler(_req: unknown, res: ApiResponse) {
  const route = "/api/notion/artists";
  try {
    validateNotionEnv(route);
    const pages = await loadAll(notion, DBS.artists);
    const artists = pages
      .map(normalizeArtist)
      .sort((a, b) => (a.displayOrder - b.displayOrder) || a.name.localeCompare(b.name));
    res.writeHead(200, CACHE_HEADERS).end(JSON.stringify(artists));
  } catch (e: unknown) {
    logApiError(route, e);
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
}
