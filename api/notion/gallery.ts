import {
  notion,
  DBS,
  GALLERY_CACHE_HEADERS,
  logApiError,
  logApiSuccess,
  requireEnv,
  type ApiResponse,
} from "./_client.js";
import { loadAll, normalizeArtist, normalizeRelease, isReleasePublished } from "./_normalize.js";
import { normalizeGalleryImage, dedupeGalleryImages, sortGalleryImages } from "./_gallery.js";

export default async function handler(_req: unknown, res: ApiResponse) {
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
