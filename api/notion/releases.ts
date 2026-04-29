import { notion, DBS, CACHE_HEADERS } from "./_client.js";
import { loadAll, normalizeArtist, normalizeRelease } from "./_normalize.js";

export default async function handler(_req: any, res: any) {
  try {
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
    res.writeHead(200, CACHE_HEADERS).end(JSON.stringify(releases));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
