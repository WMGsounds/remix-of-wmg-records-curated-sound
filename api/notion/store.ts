import { notion, DBS, CACHE_HEADERS, logApiError, logApiFallback, logApiSuccess, requireEnv, type ApiResponse } from "./_client.js";
import { FALLBACK_HEADERS, fallbackStoreItems } from "./_fallback.js";
import { loadAll, normalizeArtist, normalizeRelease, normalizeStoreItem, isReleasePublished } from "./_normalize.js";
import { notionText } from "./_notionText.js";

export default async function handler(_req: unknown, res: ApiResponse) {
  const route = "/api/notion/store";
  try {
    requireEnv(route, ["NOTION_TOKEN", "NOTION_ARTISTS_DB_ID", "NOTION_RELEASES_DB_ID", "NOTION_TRACKS_DB_ID", "NOTION_STORE_DB_ID", "NOTION_RELEASE_TRACKS_DB_ID"]);
    const [artistPages, releasePages, trackPages, storePages, releaseTrackPages] = await Promise.all([
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases),
      loadAll(notion, DBS.tracks),
      loadAll(notion, DBS.storeItems),
      loadAll(notion, DBS.releaseTracks),
    ]);

    // Real track count per release, from the Release Tracks pivot. The store
    // Product schema derives MusicAlbum vs MusicRecording from this, never from
    // the release-type label.
    const trackCountByRelease = new Map<string, number>();
    for (const rt of releaseTrackPages) {
      const releaseId = (rt as any)?.properties?.["Release"]?.relation?.[0]?.id;
      if (!releaseId) continue;
      trackCountByRelease.set(releaseId, (trackCountByRelease.get(releaseId) ?? 0) + 1);
    }

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
      const title = notionText(titleField);

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

    // Strip internal-only fields before sending. Store visibility keeps its own
    // rules (Published / Availability / Pre-order?), but a store item must not
    // link to a release page that isn't publicly eligible yet — drop the slug so
    // the item still renders with its release metadata, minus a dead link.
    const payload = items.map(({ published, sortOrder, ...rest }) => {
      if (!rest.release) return rest;
      const linked = releaseLookup.get(rest.release.id);
      const eligible = linked ? isReleasePublished(linked) : false;
      return eligible ? rest : { ...rest, release: { ...rest.release, slug: "" } };
    });

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
