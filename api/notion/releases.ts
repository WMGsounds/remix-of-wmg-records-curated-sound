import { notion, DBS, RELEASE_CACHE_HEADERS, logApiError, logApiFallback, logApiSuccess, validateNotionEnv, type ApiResponse } from "./_client.js";
import { FALLBACK_HEADERS, fallbackReleases } from "./_fallback.js";
import { loadAll, normalizeArtist, normalizeRelease, isReleasePublished } from "./_normalize.js";

export default async function handler(_req: unknown, res: ApiResponse) {
  const route = "/api/notion/releases";
  try {
    validateNotionEnv(route);
    const [artistPages, releasePages] = await Promise.all([
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases),
    ]);
    const artistLookup = new Map(
      artistPages
        .map((p) => normalizeArtist(p))
        .filter((a) => a.showOnWebsite !== false)
        .map((a) => [a.id, a]),
    );
    const releases = releasePages
      .map((p) => normalizeRelease(p, artistLookup))
      .filter((r) => artistLookup.has(r.artistId) && isReleasePublished(r))
      .sort((a, b) => +new Date(b.releaseDate) - +new Date(a.releaseDate));
    logApiSuccess(route, { artistPageCount: artistPages.length, releasePageCount: releasePages.length, releaseCount: releases.length });
    res.writeHead(200, RELEASE_CACHE_HEADERS).end(JSON.stringify(releases));
  } catch (e: unknown) {
    logApiError(route, e);
    logApiFallback(route, e, { fallbackReleaseCount: fallbackReleases.length });
    res.writeHead(200, FALLBACK_HEADERS).end(JSON.stringify(fallbackReleases));
  }
}
