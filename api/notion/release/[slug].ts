import { notion, DBS, CACHE_HEADERS, logApiError, validateNotionEnv, type ApiRequest, type ApiResponse } from "../_client.js";
import { FALLBACK_HEADERS, fallbackReleasePage } from "../_fallback.js";
import { loadAll, normalizeArtist, normalizeRelease, normalizeReleaseTrack } from "../_normalize.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const route = "/api/notion/release/[slug]";
  const { slug } = req.query;
  try {
    validateNotionEnv(route);
    const [artistPages, releasePages, trackPages, releaseTrackPages] = await Promise.all([
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases),
      loadAll(notion, DBS.tracks),
      loadAll(notion, DBS.releaseTracks),
    ]);
    const artists = artistPages.map(normalizeArtist);
    const artistLookup = new Map(artists.map((a) => [a.id, a]));
    const releases = releasePages.map((p) => normalizeRelease(p, artistLookup));
    const release = releases.find((r) => r.slug === slug);
    if (!release) return res.status(404).json(null);

    // Build a lookup of raw Track pages so we can read related Track title + duration.
    const trackPageLookup = new Map(trackPages.map((p: any) => [p.id, p]));

    const tracks = releaseTrackPages
      .map((p) => normalizeReleaseTrack(p, trackPageLookup))
      .filter((rt) => rt.releaseId === release.id)
      .sort((a, b) => a.trackNumber - b.trackNumber)
      // Reshape to the Track shape the frontend expects.
      .map((rt) => ({
        id: rt.id,
        trackTitle: rt.title,
        releaseId: rt.releaseId,
        releaseSlug: release.slug,
        trackNumber: rt.trackNumber,
        duration: rt.duration,
        lyrics: rt.lyrics,
        spotifyUrl: rt.spotifyUrl,
        side: rt.side,
        versionLabel: rt.versionLabel,
      }));

    const artist = artists.find((a) => a.id === release.artistId) ?? null;
    const related = releases
      .filter((r) => r.artistSlug === release.artistSlug && r.slug !== slug)
      .sort((a, b) => +new Date(b.releaseDate) - +new Date(a.releaseDate))
      .slice(0, 3);

    res.writeHead(200, CACHE_HEADERS).end(
      JSON.stringify({ release, artist, tracks, related }),
    );
  } catch (e: unknown) {
    logApiError(route, e, { slug });
    const fallback = fallbackReleasePage(String(slug ?? ""));
    if (!fallback) return res.status(404).json(null);
    res.writeHead(200, FALLBACK_HEADERS).end(JSON.stringify(fallback));
  }
}
