import { notion, DBS, RELEASE_CACHE_HEADERS, logApiError, logApiFallback, logApiSuccess, validateNotionEnv, type ApiResponse } from "./_client.js";
import { FALLBACK_HEADERS, fallbackTracks } from "./_fallback.js";
import { loadAll, normalizeRelease, normalizeArtist, normalizeReleaseTrack, isReleasePublished } from "./_normalize.js";

export default async function handler(_req: unknown, res: ApiResponse) {
  const route = "/api/notion/tracks";
  try {
    validateNotionEnv(route);
    // Use the Release Tracks pivot DB — same source as individual Release pages —
    // so a track's release linkage, ordering and display title match exactly.
    const [artistPages, releasePages, trackPages, releaseTrackPages] = await Promise.all([
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases),
      loadAll(notion, DBS.tracks),
      loadAll(notion, DBS.releaseTracks),
    ]);
    const artistLookup = new Map(artistPages.map((p) => [p.id, normalizeArtist(p)]));
    const releaseLookup = new Map(
      releasePages.map((p) => [p.id, normalizeRelease(p, artistLookup)]),
    );
    const trackPageLookup = new Map(trackPages.map((p: any) => [p.id, p]));

    const tracks = releaseTrackPages
      .map((p) => normalizeReleaseTrack(p, trackPageLookup))
      .filter((rt) => {
        const rel = releaseLookup.get(rt.releaseId);
        return Boolean(rel) && isReleasePublished(rel);
      })
      .map((rt) => {
        const rel = releaseLookup.get(rt.releaseId);
        return {
          id: rt.id,
          trackTitle: rt.title,
          releaseId: rt.releaseId,
          releaseSlug: rel?.slug ?? "",
          trackNumber: rt.trackNumber,
          duration: rt.duration,
          lyrics: rt.lyrics,
          spotifyUrl: rt.spotifyUrl,
          side: rt.side,
          versionLabel: rt.versionLabel,
        };
      })
      .sort((a, b) => a.trackNumber - b.trackNumber);

    logApiSuccess(route, {
      artistPageCount: artistPages.length,
      releasePageCount: releasePages.length,
      trackPageCount: trackPages.length,
      releaseTrackPageCount: releaseTrackPages.length,
      trackCount: tracks.length,
    });
    res.writeHead(200, RELEASE_CACHE_HEADERS).end(JSON.stringify(tracks));
  } catch (e: unknown) {
    logApiError(route, e);
    logApiFallback(route, e, { fallbackTrackCount: fallbackTracks.length });
    res.writeHead(200, FALLBACK_HEADERS).end(JSON.stringify(fallbackTracks));
  }
}
