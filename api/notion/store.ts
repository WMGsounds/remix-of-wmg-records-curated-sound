import { notion, DBS, CACHE_HEADERS, logApiError, logApiFallback, logApiSuccess, requireEnv, type ApiResponse } from "./_client.js";
import { FALLBACK_HEADERS, fallbackStoreItems } from "./_fallback.js";
import { loadAll, normalizeArtist, normalizeRelease, normalizeStoreItem } from "./_normalize.js";

export default async function handler(_req: unknown, res: ApiResponse) {
  const route = "/api/notion/store";
  try {
    requireEnv(route, ["NOTION_TOKEN", "NOTION_ARTISTS_DB_ID", "NOTION_RELEASES_DB_ID", "NOTION_TRACKS_DB_ID", "NOTION_STORE_DB_ID"]);
    const [artistPages, releasePages, trackPages, storePages] = await Promise.all([
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases),
      loadAll(notion, DBS.tracks),
      loadAll(notion, DBS.storeItems),
    ]);

    const artistLookup = new Map(artistPages.map((p) => [p.id, normalizeArtist(p)]));
    const releaseLookup = new Map(
      releasePages.map((p) => [p.id, normalizeRelease(p, artistLookup)]),
    );
    const trackLookup = new Map<string, { id: string; title: string }>();
    for (const t of trackPages) {
      const props = t.properties ?? {};
      const titleField =
        props["Track Title"] ??
        Object.values(props).find((p: any) => p?.type === "title");
      const title = (() => {
        if (!titleField) return "";
        if (Array.isArray(titleField?.rich_text)) {
          return titleField.rich_text.map((x: any) => x.plain_text).join("").trim();
        }
        if (Array.isArray(titleField?.title)) {
          return titleField.title.map((x: any) => x.plain_text).join("").trim();
        }
        return "";
      })();
      trackLookup.set(t.id, { id: t.id, title });
    }

    const normalized = storePages.map((p) =>
      normalizeStoreItem(p, { artistLookup, releaseLookup, trackLookup }),
    );

    const items = normalized
      .filter((s) => s.published === true && s.availability !== "Hidden")
      .sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        const ta = new Date(a.createdTime).getTime() || 0;
        const tb = new Date(b.createdTime).getTime() || 0;
        return tb - ta;
      });

    // Strip internal-only fields before sending.
    const payload = items.map(({ published, sortOrder, ...rest }) => rest);

    logApiSuccess(route, {
      storePageCount: storePages.length,
      itemCount: payload.length,
    });
    res.writeHead(200, CACHE_HEADERS).end(JSON.stringify(payload));
  } catch (e: unknown) {
    logApiError(route, e);
    logApiFallback(route, e, { fallbackStoreCount: fallbackStoreItems.length });
    res.writeHead(200, FALLBACK_HEADERS).end(JSON.stringify(fallbackStoreItems));
  }
}
