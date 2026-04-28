import { notion, DBS, CACHE_HEADERS } from "./_client";
import { loadAll, normalizeArtist, normalizeRelease } from "./_normalize";

export default async function handler(_req: any, res: any) {
  try {
    const [artistPages, releasePages] = await Promise.all([
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases),
    ]);
    const artists = artistPages.map(normalizeArtist);
    const artistLookup = new Map(artists.map((a) => [a.id, a]));
    const releases = releasePages.map((p) => normalizeRelease(p, artistLookup));

    const featuredArtists = artists
      .filter((a) => a.featured)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .slice(0, 6);

    const latestReleases = releases
      .filter((r) => r.showOnHomepage)
      .sort((a, b) => +new Date(b.releaseDate) - +new Date(a.releaseDate))
      .slice(0, 6);

    const featuredRelease = releases.find((r) => r.featured) ?? latestReleases[0] ?? null;

    res.writeHead(200, CACHE_HEADERS).end(
      JSON.stringify({ featuredArtists, latestReleases, featuredRelease }),
    );
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
