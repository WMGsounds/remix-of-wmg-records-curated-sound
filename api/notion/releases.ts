import { notion, DBS, CACHE_HEADERS, logApiError, logApiFallback, logApiSuccess, validateNotionEnv, type ApiResponse } from "./_client.js";
import { FALLBACK_HEADERS, fallbackReleases } from "./_fallback.js";
import { loadAll, normalizeArtist, normalizeRelease } from "./_normalize.js";

export default async function handler(_req: unknown, res: ApiResponse) {
  const route = "/api/notion/releases";
  try {
    validateNotionEnv(route);
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
    logApiSuccess(route, { artistPageCount: artistPages.length, releasePageCount: releasePages.length, releaseCount: releases.length });
    res.writeHead(200, CACHE_HEADERS).end(JSON.stringify(releases));
  } catch (e: unknown) {
    logApiError(route, e);
    logApiFallback(route, e, { fallbackReleaseCount: fallbackReleases.length });
    res.writeHead(200, FALLBACK_HEADERS).end(JSON.stringify(fallbackReleases));
  }
}
