import { notion, DBS, CACHE_HEADERS, logApiError, logApiSuccess, requireEnv, type ApiResponse } from "./_client.js";
import { FALLBACK_HEADERS } from "./_fallback.js";
import { loadAll, normalizeArtist, normalizeRelease } from "./_normalize.js";
import { normalizeJournal, type JournalArticle } from "./_journal.js";

export type JournalListItem = JournalArticle & {
  artists: { id: string; slug: string; name: string }[];
  releases: { id: string; slug: string; title: string; coverArt: string }[];
};

export default async function handler(_req: unknown, res: ApiResponse) {
  const route = "/api/notion/journal";
  try {
    requireEnv(route, ["NOTION_TOKEN", "NOTION_JOURNAL_DB_ID", "NOTION_ARTISTS_DB_ID", "NOTION_RELEASES_DB_ID"]);
    const [journalPages, artistPages, releasePages] = await Promise.all([
      loadAll(notion, DBS.journal),
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases),
    ]);

    const artists = artistPages.map(normalizeArtist);
    const artistMap = new Map(artists.map((a) => [a.id, a]));
    const releases = releasePages.map((p) => normalizeRelease(p, artistMap));
    const releaseMap = new Map(releases.map((r) => [r.id, r]));

    const articles: JournalListItem[] = journalPages
      .map(normalizeJournal)
      .filter((a) => a.published && !a.noindex)
      .map((a) => ({
        ...a,
        artists: a.artistIds.map((id) => artistMap.get(id)).filter(Boolean).map((x: any) => ({ id: x.id, slug: x.slug, name: x.name })),
        releases: a.releaseIds.map((id) => releaseMap.get(id)).filter(Boolean).map((x: any) => ({ id: x.id, slug: x.slug, title: x.title, coverArt: x.coverArt })),
      }))
      .sort((a, b) => {
        const ad = a.publishedDate || a.lastEditedTime || a.createdTime;
        const bd = b.publishedDate || b.lastEditedTime || b.createdTime;
        return +new Date(bd) - +new Date(ad);
      });

    logApiSuccess(route, { count: articles.length });
    res.writeHead(200, CACHE_HEADERS).end(JSON.stringify(articles));
  } catch (e: unknown) {
    logApiError(route, e);
    res.writeHead(200, FALLBACK_HEADERS).end(JSON.stringify([]));
  }
}
