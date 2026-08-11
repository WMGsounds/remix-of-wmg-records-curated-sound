import { notion, DBS, CACHE_HEADERS, RELEASE_CACHE_HEADERS, GALLERY_CACHE_HEADERS, requireEnv, logApiError, logApiFallback, logApiSuccess, validateNotionEnv, type ApiRequest, type ApiResponse } from "./_client.js";
import { FALLBACK_HEADERS, fallbackArtists, fallbackTracks } from "./_fallback.js";
import { loadAll, normalizeArtist, normalizeRelease, normalizeReleaseTrack, normalizeCatalogueTrack, isReleasePublished } from "./_normalize.js";
import { normalizeGalleryImage, dedupeGalleryImages, sortGalleryImages } from "./_gallery.js";
import { selectTrackYouTubeUrls } from "./_videos.js";

/**
 * Videos are an enhancement only: any failure (missing env, Notion error) must
 * leave the catalogue and its other streaming links completely intact.
 */
async function loadTrackYouTubeUrls(route: string): Promise<Map<string, string>> {
  try {
    if (!process.env.NOTION_VIDEOS_DATABASE_ID) return new Map();
    const pages = await loadAll(notion, DBS.videos);
    return selectTrackYouTubeUrls(pages, Date.now());
  } catch (e) {
    console.warn("[notion-api] Videos lookup failed; tracks render without YouTube buttons", {
      route,
      error: (e as Error)?.message ?? String(e),
    });
    return new Map();
  }
}

/**
 * Serves two datasets from a single serverless function (Vercel Hobby plan
 * limit of 12 functions):
 *   /api/notion/artists            -> artists  (default)
 *   /api/notion/tracks             -> tracks   (rewritten to ?dataset=tracks)
 *   /api/notion/gallery            -> gallery  (rewritten to ?dataset=gallery)
 * Both public URLs and response shapes are unchanged.
 */
export default async function handler(req: ApiRequest | undefined, res: ApiResponse) {
  const datasetParam = req?.query?.dataset;
  const dataset = Array.isArray(datasetParam) ? datasetParam[0] : datasetParam;
  if (dataset === "tracks") return handleTracks(res);
  if (dataset === "gallery") return handleGallery(res);
  if (dataset === "catalogue") return handleCatalogue(res);
  return handleArtists(res);
}

async function handleArtists(res: ApiResponse) {
  const route = "/api/notion/artists";
  try {
    validateNotionEnv(route);
    const pages = await loadAll(notion, DBS.artists);
    const artists = pages
      .map(normalizeArtist)
      .filter((a) => a.showOnWebsite !== false)
      .sort((a, b) => (a.displayOrder - b.displayOrder) || a.name.localeCompare(b.name));
    logApiSuccess(route, { pageCount: pages.length, artistCount: artists.length });
    res.writeHead(200, CACHE_HEADERS).end(JSON.stringify(artists));
  } catch (e: unknown) {
    logApiError(route, e);
    logApiFallback(route, e, { fallbackArtistCount: fallbackArtists.length });
    res.writeHead(200, FALLBACK_HEADERS).end(JSON.stringify(fallbackArtists));
  }
}

async function handleTracks(res: ApiResponse) {
  const route = "/api/notion/tracks";
  try {
    validateNotionEnv(route);
    // Use the Release Tracks pivot DB — same source as individual Release pages —
    // so a track's release linkage, ordering and display title match exactly.
    const [artistPages, releasePages, trackPages, releaseTrackPages] = await Promise.all([
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases),
      loadAll(notion, DBS.tracks),
      loadAll(notion, DBS.releaseTracks),
    ]);
    const artistLookup = new Map(artistPages.map((p) => [p.id, normalizeArtist(p)]));
    const releaseLookup = new Map(
      releasePages.map((p) => [p.id, normalizeRelease(p, artistLookup)]),
    );
    const trackPageLookup = new Map(trackPages.map((p: any) => [p.id, p]));

    const tracks = releaseTrackPages
      .map((p) => normalizeReleaseTrack(p, trackPageLookup))
      .filter((rt) => {
        const rel = releaseLookup.get(rt.releaseId);
        return rel ? isReleasePublished(rel) : false;
      })
      .map((rt) => {
        const rel = releaseLookup.get(rt.releaseId);
        return {
          id: rt.id,
          trackTitle: rt.title,
          releaseId: rt.releaseId,
          releaseSlug: rel?.slug ?? "",
          releaseTitle: rel?.title ?? "",
          releaseDate: rel?.releaseDate ?? "",
          artistName: rel?.artistName ?? "",
          artistSlug: rel?.artistSlug ?? "",
          trackNumber: rt.trackNumber,
          duration: rt.duration,
          lyrics: rt.lyrics,
          spotifyUrl: rt.spotifyUrl,
          youtubeOfficialAudio: rt.youtubeOfficialAudio,
          youtubeLyricVideo: rt.youtubeLyricVideo,
          youtubeMusicVideo: rt.youtubeMusicVideo,
          side: rt.side,
          versionLabel: rt.versionLabel,
        };

      })
      .sort((a, b) => a.trackNumber - b.trackNumber);

    logApiSuccess(route, {
      artistPageCount: artistPages.length,
      releasePageCount: releasePages.length,
      trackPageCount: trackPages.length,
      releaseTrackPageCount: releaseTrackPages.length,
      trackCount: tracks.length,
    });
    res.writeHead(200, RELEASE_CACHE_HEADERS).end(JSON.stringify(tracks));
  } catch (e: unknown) {
    logApiError(route, e);
    logApiFallback(route, e, { fallbackTrackCount: fallbackTracks.length });
    res.writeHead(200, FALLBACK_HEADERS).end(JSON.stringify(fallbackTracks));
  }
}

async function handleGallery(res: ApiResponse) {
  const route = "/api/notion/gallery";
  try {
    requireEnv(route, ["NOTION_TOKEN", "NOTION_GALLERY_DATABASE_ID"]);

    const [galleryPages, artistPages, releasePages] = await Promise.all([
      loadAll(notion, DBS.gallery),
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases),
    ]);

    const artistLookup = new Map(artistPages.map((p: any) => [p.id, normalizeArtist(p)]));
    const releaseLookup = new Map(
      releasePages.map((p: any) => {
        const r = normalizeRelease(p, artistLookup);
        return [p.id, { title: r.title, slug: r.slug, published: isReleasePublished(r) }] as const;
      }),
    );

    const now = Date.now();
    const images = sortGalleryImages(
      dedupeGalleryImages(
        galleryPages
          .map((p: any) => normalizeGalleryImage(p, releaseLookup as any, now))
          .filter((x): x is NonNullable<typeof x> => x !== null),
      ),
    );

    logApiSuccess(route, { galleryPageCount: galleryPages.length, publishedCount: images.length });
    res.writeHead(200, GALLERY_CACHE_HEADERS).end(JSON.stringify(images));
  } catch (e: unknown) {
    // Fail closed: never fall back to placeholder or hidden records.
    logApiError(route, e);
    res
      .writeHead(500, { "Content-Type": "application/json", "Cache-Control": "no-store" })
      .end(JSON.stringify({ error: "Gallery is temporarily unavailable." }));
  }
}

async function handleCatalogue(res: ApiResponse) {
  const route = "/api/notion/catalogue";
  try {
    validateNotionEnv(route);
    const [artistPages, releasePages, trackPages, releaseTrackPages, youtubeByTrackId] =
      await Promise.all([
        loadAll(notion, DBS.artists),
        loadAll(notion, DBS.releases),
        loadAll(notion, DBS.tracks),
        loadAll(notion, DBS.releaseTracks),
        loadTrackYouTubeUrls(route),
      ]);

    const artistLookup = new Map(artistPages.map((p: any) => [p.id, normalizeArtist(p)]));
    const releaseLookup = new Map(
      releasePages.map((p: any) => [p.id, normalizeRelease(p, artistLookup)]),
    );
    const releaseTrackLookup = new Map(releaseTrackPages.map((p: any) => [p.id, p]));

    const normalizedTracks = trackPages.map((p: any) =>
      normalizeCatalogueTrack(p, { artistLookup, releaseTrackLookup, releaseLookup, youtubeByTrackId }),
    );

    // ISRC is required for the catalogue (it is the recording's identifier in
    // MusicRecording schema). Name every track dropped for a missing ISRC so
    // the gap is visible in the logs instead of silently shrinking /music.
    const missingIsrc = normalizedTracks
      .filter((t) => Boolean(t.title) && !(t as any).isrc?.trim())
      .map((t) => t.title);
    if (missingIsrc.length) {
      console.warn(
        `[notion-api] ${route} — ${missingIsrc.length} track(s) excluded from the catalogue for a missing ISRC: ${missingIsrc.join("; ")}`,
      );
    }

    const tracks = normalizedTracks
      .filter((t) => Boolean(t.title) && Boolean((t as any).isrc?.trim()))

      .sort(
        (a, b) =>
          (a.artists[0]?.displayOrder ?? 9999) - (b.artists[0]?.displayOrder ?? 9999)
          || (a.artists[0]?.name ?? "").localeCompare(b.artists[0]?.name ?? "")
          || a.title.localeCompare(b.title),
      );

    logApiSuccess(route, {
      trackPageCount: trackPages.length,
      catalogueCount: tracks.length,
      tracksMissingIsrc: missingIsrc.length,
      tracksWithYouTube: youtubeByTrackId.size,
    });
    res.writeHead(200, RELEASE_CACHE_HEADERS).end(JSON.stringify(tracks));
  } catch (e: unknown) {
    logApiError(route, e);
    res
      .writeHead(500, { "Content-Type": "application/json", "Cache-Control": "no-store" })
      .end(JSON.stringify({ error: "The catalogue is temporarily unavailable." }));
  }
}
