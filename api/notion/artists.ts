import { notion, DBS, CACHE_HEADERS } from "./_client.js";
import { loadAll, normalizeArtist } from "./_normalize.js";

export default async function handler(_req: any, res: any) {
  try {
    const pages = await loadAll(notion, DBS.artists);
    const artists = pages
      .map(normalizeArtist)
      .sort((a, b) => (a.displayOrder - b.displayOrder) || a.name.localeCompare(b.name));
    res.writeHead(200, CACHE_HEADERS).end(JSON.stringify(artists));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
