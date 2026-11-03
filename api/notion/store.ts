import { notion, DBS, CACHE_HEADERS, logApiError, logApiSuccess, requireEnv, type ApiResponse } from "./_client.js";
import { loadAll, normalizeArtist, normalizeRelease, normalizeStoreItem, isReleasePublished } from "./_normalize.js";
import { notionText } from "./_notionText.js";
import { handleStoreContext } from "./_storeRegion.js";
import { catalogueCache } from "./_catalogueCache.js";
import { getItunesPrices } from "./_itunes.js";
import { storeCountry } from "../../src/lib/itunes.js";

const loadCatalogue = catalogueCache(async () => {
    requireEnv("/api/notion/store", ["NOTION_TOKEN", "NOTION_ARTISTS_DB_ID", "NOTION_RELEASES_DB_ID", "NOTION_TRACKS_DB_ID", "NOTION_STORE_DB_ID", "NOTION_RELEASE_TRACKS_DB_ID"]);
    // Keep cold catalogue loading within a modest request burst. Country requests
    // share this one load instead of each querying all five Notion databases.
    const artistPages = await loadAll(notion, DBS.artists);
    const releasePages = await loadAll(notion, DBS.releases);
    const trackPages = await loadAll(notion, DBS.tracks);
    const storePages = await loadAll(notion, DBS.storeItems);
    const releaseTrackPages = await loadAll(notion, DBS.releaseTracks);

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
      const release = {
        ...rest.release,
        slug: eligible ? rest.release.slug : "",
        trackCount: trackCountByRelease.get(rest.release.id) ?? 0,
      };
      return { ...rest, release };
    });

    return payload;
});

export default async function handler(req: Parameters<typeof handleStoreContext>[0], res: ApiResponse) {
  if (await handleStoreContext(req, res)) return;
  const itunesRequest = req.query?.context === "itunes";
  const country = storeCountry(req.query?.country);
  if (itunesRequest && !country) {
    res.writeHead(400, { "Content-Type": "application/json", "Cache-Control": "no-store" }).end(JSON.stringify({ error: "Choose a valid store country" }));
    return;
  }
  const route = "/api/notion/store";
  try {
    const payload = await loadCatalogue();

    if (itunesRequest) {
      const prices = await getItunesPrices(payload, country!);
      const remaining = Math.max(0, Math.floor((Date.parse(prices.expiresAt) - Date.now()) / 1000));
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Vercel-CDN-Cache-Control": `public, s-maxage=${remaining}, must-revalidate`,
      }).end(JSON.stringify(prices));
      return;
    }
    logApiSuccess(route, {
      itemCount: payload.length,
    });
    res.writeHead(200, CACHE_HEADERS).end(JSON.stringify(payload));
  } catch (e: unknown) {
    logApiError(route, e);
    if (itunesRequest) {
      res.writeHead(503, { "Content-Type": "application/json", "Cache-Control": "no-store", "Vercel-CDN-Cache-Control": "no-store", "Retry-After": "60" })
        .end(JSON.stringify({ error: "iTunes prices temporarily unavailable" }));
      return;
    }
    // Never present sample products as real releases during a CMS outage.
    res.writeHead(503, { "Content-Type": "application/json", "Cache-Control": "no-store", "Vercel-CDN-Cache-Control": "no-store", "Retry-After": "60" })
      .end(JSON.stringify({ error: "Store temporarily unavailable. Please try again shortly." }));
  }
}
