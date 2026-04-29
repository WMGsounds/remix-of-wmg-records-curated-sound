import { notion, DBS, CACHE_HEADERS } from "../_client.js";
import { loadAll, normalizeArtist, normalizeRelease, normalizeTrack } from "../_normalize.js";

export default async function handler(req: any, res: any) {
  const { slug } = req.query;
  try {
    const [artistPages, releasePages, trackPages] = await Promise.all([
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases),
      loadAll(notion, DBS.tracks),
    ]);
    const artists = artistPages.map(normalizeArtist);
    const artistLookup = new Map(artists.map((a) => [a.id, a]));
    const releases = releasePages.map((p) => normalizeRelease(p, artistLookup));
    const release = releases.find((r) => r.slug === slug);
    if (!release) return res.status(404).json(null);

    const releaseLookup = new Map(releases.map((r) => [r.id, r]));
    const tracks = trackPages
      .map((p) => normalizeTrack(p, releaseLookup))
      .filter((t) => t.releaseSlug === slug)
      .sort((a, b) => a.trackNumber - b.trackNumber);

    const artist = artists.find((a) => a.id === release.artistId) ?? null;
    const related = releases
      .filter((r) => r.artistSlug === release.artistSlug && r.slug !== slug)
      .sort((a, b) => +new Date(b.releaseDate) - +new Date(a.releaseDate))
      .slice(0, 3);

    res.writeHead(200, CACHE_HEADERS).end(
      JSON.stringify({ release, artist, tracks, related }),
    );
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
