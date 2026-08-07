import {
  notion,
  DBS,
  VIDEO_CACHE_HEADERS,
  logApiError,
  logApiSuccess,
  requireEnv,
  type ApiResponse,
} from "./_client.js";
import { loadAll, normalizeArtist } from "./_normalize.js";
import { normalizeVideo, sortVideos, type VideoItem } from "./_videos.js";

/**
 * /api/notion/videos — the dedicated Videos database is the sole source of
 * video records. Release-date / visibility filtering happens here on the
 * server so future-dated videos can never reach the browser.
 */
export default async function handler(_req: unknown, res: ApiResponse) {
  const route = "/api/notion/videos";
  try {
    requireEnv(route, ["NOTION_TOKEN", "NOTION_VIDEOS_DATABASE_ID", "NOTION_ARTISTS_DB_ID"]);

    const [videoPages, artistPages] = await Promise.all([
      loadAll(notion, DBS.videos),
      loadAll(notion, DBS.artists),
    ]);

    // Single artists fetch resolves every Artists relation (no per-video request).
    const artistLookup = new Map(
      artistPages.map((p: any) => {
        const a = normalizeArtist(p);
        return [p.id, { id: a.id, name: a.name, slug: a.slug || undefined }] as const;
      }),
    );

    const now = Date.now();
    const videos: VideoItem[] = sortVideos(
      videoPages
        .map((p: any) => {
          try {
            return normalizeVideo(p, artistLookup as any, now);
          } catch (err) {
            console.warn("[notion-api] Skipping malformed video row", { route, id: p?.id, err });
            return null;
          }
        })
        .filter((v): v is VideoItem => v !== null),
    );

    logApiSuccess(route, { videoPageCount: videoPages.length, publishedCount: videos.length });
    res.writeHead(200, VIDEO_CACHE_HEADERS).end(JSON.stringify(videos));
  } catch (e: unknown) {
    // Fail closed — never fall back to the legacy Tracks YouTube fields.
    logApiError(route, e);
    res
      .writeHead(500, { "Content-Type": "application/json", "Cache-Control": "no-store" })
      .end(JSON.stringify({ error: "Videos are temporarily unavailable." }));
  }
}
