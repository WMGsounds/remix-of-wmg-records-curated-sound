import { notion, DBS, CACHE_HEADERS, logApiError, logApiFallback, logApiSuccess, validateNotionEnv, type ApiResponse } from "./_client.js";
import { FALLBACK_HEADERS, fallbackTracks } from "./_fallback.js";
import { loadAll, normalizeRelease, normalizeArtist, normalizeTrack } from "./_normalize.js";

export default async function handler(_req: unknown, res: ApiResponse) {
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
    logApiSuccess(route, { artistPageCount: artistPages.length, releasePageCount: releasePages.length, trackPageCount: trackPages.length, trackCount: tracks.length });
    res.writeHead(200, CACHE_HEADERS).end(JSON.stringify(tracks));
  } catch (e: unknown) {
    logApiError(route, e);
    logApiFallback(route, e, { fallbackTrackCount: fallbackTracks.length });
    res.writeHead(200, FALLBACK_HEADERS).end(JSON.stringify(fallbackTracks));
  }
}
