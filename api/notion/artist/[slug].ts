import { notion, DBS, CACHE_HEADERS } from "../_client.js";
import { loadAll, normalizeArtist, normalizeRelease } from "../_normalize.js";

export default async function handler(req: any, res: any) {
  const { slug } = req.query;
  try {
    const [artistPages, releasePages] = await Promise.all([
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases),
    ]);
    const artists = artistPages.map(normalizeArtist);
    const artist = artists.find((a) => a.slug === slug);
    if (!artist) return res.status(404).json(null);

    const artistLookup = new Map(artists.map((a) => [a.id, a]));
    const discography = releasePages
      .map((p) => normalizeRelease(p, artistLookup))
      .filter((r) => r.artistSlug === slug)
      .sort((a, b) => +new Date(b.releaseDate) - +new Date(a.releaseDate));

    res.writeHead(200, CACHE_HEADERS).end(JSON.stringify({ artist, discography }));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
