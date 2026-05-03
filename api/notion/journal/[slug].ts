import { notion, DBS, CACHE_HEADERS, logApiError, requireEnv, type ApiRequest, type ApiResponse } from "../_client.js";
import { FALLBACK_HEADERS } from "../_fallback.js";
import { loadAll, normalizeArtist, normalizeRelease } from "../_normalize.js";
import { normalizeJournal, fetchPageBlocks, estimateReadingTime, deriveExcerpt } from "../_journal.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const route = "/api/notion/journal/[slug]";
  const slug = String(req.query.slug ?? "");
  try {
    requireEnv(route, ["NOTION_TOKEN", "NOTION_JOURNAL_DB_ID", "NOTION_ARTISTS_DB_ID", "NOTION_RELEASES_DB_ID"]);
    const [journalPages, artistPages, releasePages] = await Promise.all([
      loadAll(notion, DBS.journal),
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases),
    ]);

    const articles = journalPages.map(normalizeJournal).filter((a) => a.published);
    const article = articles.find((a) => a.slug === slug);
    if (!article) return res.status(404).json(null);

    const blocks = await fetchPageBlocks(notion, article.id);

    const artists = artistPages.map(normalizeArtist);
    const artistMap = new Map(artists.map((a) => [a.id, a]));
    const releases = releasePages.map((p) => normalizeRelease(p, artistMap));
    const releaseMap = new Map(releases.map((r) => [r.id, r]));

    const relatedArtists = article.artistIds.map((id) => artistMap.get(id)).filter(Boolean);
    const relatedReleases = article.releaseIds.map((id) => releaseMap.get(id)).filter(Boolean);

    const excerpt = article.excerpt || deriveExcerpt(blocks);
    const readingTime = article.readingTime > 0 ? article.readingTime : estimateReadingTime(blocks);

    res.writeHead(200, CACHE_HEADERS).end(JSON.stringify({
      article: { ...article, excerpt, readingTime },
      blocks,
      relatedArtists,
      relatedReleases,
    }));
  } catch (e: unknown) {
    logApiError(route, e, { slug });
    res.writeHead(404, FALLBACK_HEADERS).end(JSON.stringify(null));
  }
}
