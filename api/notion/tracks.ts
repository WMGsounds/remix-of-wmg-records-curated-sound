import { notion, DBS, CACHE_HEADERS, logApiError, validateNotionEnv } from "./_client.js";
import { loadAll, normalizeRelease, normalizeArtist, normalizeTrack } from "./_normalize.js";

export default async function handler(_req: any, res: any) {
  const route = "/api/notion/tracks";
  try {
    validateNotionEnv(route);
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
    logApiError(route, e);
    res.status(500).json({ error: e.message });
  }
}
