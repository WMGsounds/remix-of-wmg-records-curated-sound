import sharp from "sharp";
import { notion, DBS, logApiError, logApiSuccess, requireEnv, type ApiRequest, type ApiResponse } from "./notion/_client.js";
import { loadAll, normalizeArtist, normalizeRelease, isReleasePublished } from "./notion/_normalize.js";
import { normalizeJournal, isJournalPublished } from "./notion/_journal.js";
import { compactId, keySegment, slugifyName } from "./notion/_mediaUrls.js";
import {
  normalizeGalleryImage,
  galleryRawFileUrl,
  galleryPageId,
  galleryIdSegment,
  slugifyImageTitle,
} from "./notion/_gallery.js";
import {
  artistSlugMap,
  findProp,
  firstFileUrl,
  matchReleaseByCompositeKey,
  normalizeCompositeKey,
  propertyText,
  sanitizeFilename,
} from "./notion/_media.js";

// Browsers cache the resized result for a year (URL is unique per width).
// CDN keeps it hot, with stale-while-revalidate as a safety net.
const CACHE_CONTROL = "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable";
const WMG_FAVICON_LINK = '</favicon.ico>; rel="icon"; type="image/x-icon"';
const ALLOWED_HOSTS = new Set([
  "prod-files-secure.s3.us-west-2.amazonaws.com",
  "s3.us-west-2.amazonaws.com",
]);
const ALLOWED_WIDTHS = [16, 320, 480, 640, 960, 1280, 1600, 1920];
const DEFAULT_QUALITY = 72;

type ImageProxyResponse = ApiResponse & {
  setHeader?: (name: string, value: string) => void;
  status?: (code: number) => { json: (body: unknown) => void; end?: (body?: string) => void };
  end?: (body?: Buffer | string) => void;
};

type ImageProxyRequest = ApiRequest & {
  headers?: Record<string, string | string[] | undefined>;
  method?: string;
};

const sendError = (res: ImageProxyResponse, status: number, message: string) => {
  if (res.setHeader) res.setHeader("Cache-Control", "no-store");
  if (res.setHeader) res.setHeader("Link", WMG_FAVICON_LINK);
  return res.status?.(status).json({ error: message });
};

const getQueryValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const isAllowedImageUrl = (rawUrl: string) => {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === "https:" && ALLOWED_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
};

const pickWidth = (raw: string | undefined): number | null => {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  // Snap to the nearest allowed width to keep CDN cache entries bounded.
  return ALLOWED_WIDTHS.reduce((best, w) =>
    Math.abs(w - n) < Math.abs(best - n) ? w : best
  );
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");

const headerValue = (req: ImageProxyRequest, name: string) => {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value.join(",") : value ?? "";
};

const wantsHtmlViewer = (req: ImageProxyRequest) => {
  if (getQueryValue(req.query.raw) === "1") return false;
  const accept = headerValue(req, "accept");
  const fetchDest = headerValue(req, "sec-fetch-dest");
  return accept.includes("text/html") && fetchDest !== "image";
};

const sendHtmlViewer = (req: ImageProxyRequest, res: ImageProxyResponse, rawUrl: string) => {
  const params = new URLSearchParams({ url: rawUrl, raw: "1" });
  const requestedWidth = getQueryValue(req.query.w);
  const requestedBlur = getQueryValue(req.query.blur);
  if (requestedWidth) params.set("w", requestedWidth);
  if (requestedBlur) params.set("blur", requestedBlur);
  const imageSrc = `/api/image-proxy?${params.toString()}`;

  res.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type": "text/html; charset=utf-8",
    "Link": WMG_FAVICON_LINK,
    "X-Content-Type-Options": "nosniff",
  }).end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>WMG image</title><link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png"><style>html,body{margin:0;min-height:100%;background:#050505}body{display:grid;place-items:center;padding:48px;box-sizing:border-box}img{display:block;max-width:100%;height:auto}</style></head><body><img src="${escapeHtml(imageSrc)}" alt=""></body></html>`);
};

// ---------------------------------------------------------------------------
// Release cover-art mode: /api/image-proxy?releaseSlug=<slug>
// Rewritten from the permanent public URL /api/media/release/<slug>.jpg so the
// feature doesn't consume an extra serverless-function slot.
// ---------------------------------------------------------------------------

const MEDIA_CACHE_CONTROL = "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400";

const MEDIA_HEADERS: Record<string, string> = {
  "Content-Type": "image/jpeg",
  "Content-Disposition": "inline",
  "Access-Control-Allow-Origin": "*",
  "X-Content-Type-Options": "nosniff",
  "Cache-Control": MEDIA_CACHE_CONTROL,
};

const sendMediaError = (res: ImageProxyResponse, status: number, message: string) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "X-Content-Type-Options": "nosniff",
  }).end(JSON.stringify({ error: message }));
};

// Resolve a release from the composite public key `[artist-slug]-[release-slug]`
// using the shared loadAll() helper (v5 dataSources.query + fallback).
async function findReleasePage(compositeKey: string) {
  const [artistPages, releasePages] = await Promise.all([
    loadAll(notion, DBS.artists),
    loadAll(notion, DBS.releases),
  ]);
  return {
    ...matchReleaseByCompositeKey(releasePages, artistSlugMap(artistPages), compositeKey),
    artistPages,
  };
}



async function handleReleaseArtwork(req: ImageProxyRequest, res: ImageProxyResponse, rawSlug: string) {
  const route = "/api/image-proxy?releaseSlug";
  const method = (req.method ?? "GET").toUpperCase();
  const slug = normalizeCompositeKey(rawSlug);

  if (method !== "GET" && method !== "HEAD") {
    return sendMediaError(res, 405, "Method not allowed.");
  }
  if (!slug) return sendMediaError(res, 404, "Not found.");

  try {
    requireEnv(route, ["NOTION_TOKEN", "NOTION_RELEASES_DB_ID", "NOTION_ARTISTS_DB_ID"]);

    const match = await findReleasePage(slug);
    const page = match.page;
    if (!page) {
      const detail =
        match.reason === "missing_artist_slug"
          ? "Artist slug missing on the linked artist page"
          : match.reason === "missing_release_slug"
            ? "Release slug missing on the release page"
            : "Composite key not found in the Releases database";
      console.warn(`[media-api] ${detail}`, { route, slug, reason: match.reason });
      return sendMediaError(res, 404, "Not found.");
    }

    const props = page.properties ?? {};
    // Full public eligibility: Show on website AND the Release Date has
    // arrived in Europe/London — a future or hidden release can't be guessed.
    const artistLookup = new Map(match.artistPages.map((p: any) => [p.id, normalizeArtist(p)]));
    if (!isReleasePublished(normalizeRelease(page, artistLookup))) {
      console.warn("[media-api] Release not publicly eligible", { route, slug });
      return sendMediaError(res, 404, "Not found.");
    }

    const sourceUrl = firstFileUrl(findProp(props, "Cover Art"));
    if (!sourceUrl) {
      console.warn("[media-api] Cover art missing on release page", { route, slug });
      return sendMediaError(res, 404, "Not found.");
    }

    let source: Response;
    try {
      source = await fetch(sourceUrl, {
        headers: { Accept: "image/avif,image/webp,image/*,*/*;q=0.8" },
      });
    } catch (fetchError) {
      logApiError(route, fetchError, { slug, stage: "source-fetch" });
      return sendMediaError(res, 502, "Could not load artwork.");
    }
    if (!source.ok) {
      logApiError(route, new Error(`Source fetch failure (${source.status})`), {
        slug,
        stage: "source-fetch",
      });
      return sendMediaError(res, 502, "Could not load artwork.");
    }

    const sourceType = source.headers.get("content-type") || "";
    if (!sourceType.toLowerCase().startsWith("image/")) {
      logApiError(route, new Error(`Source is not an image (content-type: ${sourceType || "unknown"})`), {
        slug,
        stage: "source-content-type",
      });
      return sendMediaError(res, 502, "Could not load artwork.");
    }

    const input = Buffer.from(await source.arrayBuffer());
    let output: Buffer;
    try {
      output = await sharp(input, { failOn: "none" })
        .rotate()
        .jpeg({ quality: 92, chromaSubsampling: "4:4:4", mozjpeg: true })
        .toBuffer();
    } catch (sharpError) {
      logApiError(route, sharpError, { slug, stage: "sharp-conversion" });
      return sendMediaError(res, 502, "Could not process artwork.");
    }

    logApiSuccess(route, { slug, bytes: output.length });

    const headers = {
      ...MEDIA_HEADERS,
      "Content-Disposition": `inline; filename="${sanitizeFilename(slug)}.jpg"`,
      "Content-Length": String(output.length),
    };
    if (method === "HEAD") {
      res.writeHead(200, headers).end("");
      return;
    }
    res.writeHead(200, headers).end(output as unknown as string);
  } catch (error) {
    logApiError(route, error, { slug, stage: "handler" });
    return sendMediaError(res, 500, "Artwork request failed.");
  }
}


// ---------------------------------------------------------------------------
// Gallery mode: /media/gallery/<gallery-id>/<image-title>.webp
// Rewritten to /api/image-proxy?galleryId=<gallery-id> so no extra serverless
// function slot is used. The Gallery ID is the key; the slug is descriptive.
// ---------------------------------------------------------------------------

async function handleGalleryImage(req: ImageProxyRequest, res: ImageProxyResponse, rawId: string) {
  const route = "/api/image-proxy?galleryId";
  const method = (req.method ?? "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") return sendMediaError(res, 405, "Method not allowed.");

  const wanted = galleryIdSegment(decodeURIComponent(rawId ?? ""));
  if (!wanted) return sendMediaError(res, 404, "Not found.");

  try {
    requireEnv(route, ["NOTION_TOKEN", "NOTION_GALLERY_DATABASE_ID"]);

    const pages = await loadAll(notion, DBS.gallery);
    const page = pages.find((p: any) => galleryIdSegment(galleryPageId(p)) === wanted);
    if (!page) return sendMediaError(res, 404, "Not found.");

    // Same publication rules as the Gallery API (fails closed).
    const image = normalizeGalleryImage(page, new Map(), Date.now());
    if (!image) return sendMediaError(res, 404, "Not found.");

    const sourceUrl = galleryRawFileUrl(page);
    if (!sourceUrl || !isAllowedImageUrl(sourceUrl)) return sendMediaError(res, 404, "Not found.");

    const width = pickWidth(getQueryValue(req.query.w));
    const wantBlur = getQueryValue(req.query.blur) === "1";

    let source: Response;
    try {
      source = await fetch(sourceUrl, { headers: { Accept: "image/avif,image/webp,image/*,*/*;q=0.8" } });
    } catch (fetchError) {
      logApiError(route, fetchError, { galleryId: wanted, stage: "source-fetch" });
      return sendMediaError(res, 502, "Could not load image.");
    }
    if (!source.ok || !(source.headers.get("content-type") || "").toLowerCase().startsWith("image/")) {
      return sendMediaError(res, 502, "Could not load image.");
    }

    const input = Buffer.from(await source.arrayBuffer());
    let output: Buffer;
    try {
      let pipeline = sharp(input, { failOn: "none" }).rotate();
      if (wantBlur) {
        pipeline = pipeline.resize({ width: 24, withoutEnlargement: true }).blur(2).webp({ quality: 30 });
      } else {
        pipeline = pipeline
          .resize({ width: width ?? 1600, withoutEnlargement: true })
          .webp({ quality: DEFAULT_QUALITY });
      }
      output = await pipeline.toBuffer();
    } catch (sharpError) {
      logApiError(route, sharpError, { galleryId: wanted, stage: "sharp-conversion" });
      return sendMediaError(res, 502, "Could not process image.");
    }

    const filename = `${slugifyImageTitle(image.title)}.webp`;
    const headers: Record<string, string> = {
      "Content-Type": "image/webp",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": CACHE_CONTROL,
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options": "nosniff",
      "Link": WMG_FAVICON_LINK,
      "Content-Length": String(output.length),
    };
    logApiSuccess(route, { galleryId: wanted, bytes: output.length });
    if (method === "HEAD") {
      res.writeHead(200, headers).end("");
      return;
    }
    res.writeHead(200, headers).end(output as unknown as string);
  } catch (error) {
    logApiError(route, error, { galleryId: wanted, stage: "handler" });
    return sendMediaError(res, 500, "Image request failed.");
  }
}


// ---------------------------------------------------------------------------
// Shared WebP renderer for every permanent /media/* route.
// Fetches the (approved-host) Notion file, honours ?w= and ?blur=1, and sends
// it as WebP with a descriptive Content-Disposition filename.
// ---------------------------------------------------------------------------

async function serveNotionImage(
  req: ImageProxyRequest,
  res: ImageProxyResponse,
  opts: { route: string; sourceUrl: string; filenameSlug: string; context: Record<string, unknown> },
) {
  const { route, sourceUrl, filenameSlug, context } = opts;
  const method = (req.method ?? "GET").toUpperCase();
  if (!sourceUrl || !isAllowedImageUrl(sourceUrl)) return sendMediaError(res, 404, "Not found.");

  const width = pickWidth(getQueryValue(req.query.w));
  const wantBlur = getQueryValue(req.query.blur) === "1";

  let source: Response;
  try {
    source = await fetch(sourceUrl, { headers: { Accept: "image/avif,image/webp,image/*,*/*;q=0.8" } });
  } catch (fetchError) {
    logApiError(route, fetchError, { ...context, stage: "source-fetch" });
    return sendMediaError(res, 502, "Could not load image.");
  }
  if (!source.ok || !(source.headers.get("content-type") || "").toLowerCase().startsWith("image/")) {
    return sendMediaError(res, 502, "Could not load image.");
  }

  const input = Buffer.from(await source.arrayBuffer());
  let output: Buffer;
  try {
    let pipeline = sharp(input, { failOn: "none" }).rotate();
    if (wantBlur) {
      pipeline = pipeline.resize({ width: 24, withoutEnlargement: true }).blur(2).webp({ quality: 30 });
    } else {
      pipeline = pipeline
        .resize({ width: width ?? 1600, withoutEnlargement: true })
        .webp({ quality: DEFAULT_QUALITY });
    }
    output = await pipeline.toBuffer();
  } catch (sharpError) {
    logApiError(route, sharpError, { ...context, stage: "sharp-conversion" });
    return sendMediaError(res, 502, "Could not process image.");
  }

  const headers: Record<string, string> = {
    "Content-Type": "image/webp",
    "Content-Disposition": `inline; filename="${slugifyName(filenameSlug)}.webp"`,
    "Cache-Control": CACHE_CONTROL,
    "Access-Control-Allow-Origin": "*",
    "X-Content-Type-Options": "nosniff",
    "Link": WMG_FAVICON_LINK,
    "Content-Length": String(output.length),
  };
  logApiSuccess(route, { ...context, bytes: output.length });
  if (method === "HEAD") {
    res.writeHead(200, headers).end("");
    return;
  }
  res.writeHead(200, headers).end(output as unknown as string);
}

const isReadMethod = (req: ImageProxyRequest) => {
  const m = (req.method ?? "GET").toUpperCase();
  return m === "GET" || m === "HEAD";
};

// ---------------------------------------------------------------------------
// Artist images: /media/artists/<slug>/{hero|secondary}/<name>.webp
//                /media/artists/<slug>/gallery/<index>/<name>.webp
// ---------------------------------------------------------------------------

async function handleArtistImage(
  req: ImageProxyRequest,
  res: ImageProxyResponse,
  rawSlug: string,
  rawRole: string,
  rawIndex: string | undefined,
) {
  const route = "/api/image-proxy?artistSlug";
  if (!isReadMethod(req)) return sendMediaError(res, 405, "Method not allowed.");
  const slug = keySegment(decodeURIComponent(rawSlug ?? ""));
  const role = (rawRole ?? "hero").toLowerCase();
  if (!slug || !["hero", "secondary", "gallery"].includes(role)) return sendMediaError(res, 404, "Not found.");

  try {
    requireEnv(route, ["NOTION_TOKEN", "NOTION_ARTISTS_DB_ID"]);
    const pages = await loadAll(notion, DBS.artists);
    const page = pages.find((p: any) => keySegment(propertyTextOf(p, "Slug")) === slug);
    if (!page) return sendMediaError(res, 404, "Not found.");

    // Same eligibility rule as /api/notion/artist/[slug].
    const artist = normalizeArtist(page);
    if (artist.showOnWebsite === false) return sendMediaError(res, 404, "Not found.");

    const props = page.properties ?? {};
    let sourceUrl = "";
    let filenameSlug = artist.name || slug;
    if (role === "hero") {
      sourceUrl = firstFileUrl(findProp(props, "Hero Image"));
      filenameSlug = `${artist.name || slug} hero`;
    } else if (role === "secondary") {
      sourceUrl = firstFileUrl(findProp(props, "Hero Image 2"));
      filenameSlug = `${artist.name || slug} secondary image`;
    } else {
      const index = Number(rawIndex ?? "0");
      const galleryFiles = (findProp(props, "Gallery")?.files ?? []) as any[];
      const file = Number.isInteger(index) && index >= 0 ? galleryFiles[index] : undefined;
      sourceUrl = file ? (file.type === "external" ? file.external?.url ?? "" : file.file?.url ?? "") : "";
      filenameSlug = `${artist.name || slug} gallery image ${String(index + 1).padStart(2, "0")}`;
    }
    if (!sourceUrl) return sendMediaError(res, 404, "Not found.");

    return serveNotionImage(req, res, { route, sourceUrl, filenameSlug, context: { slug, role } });
  } catch (error) {
    logApiError(route, error, { slug, role, stage: "handler" });
    return sendMediaError(res, 500, "Image request failed.");
  }
}

const propertyTextOf = (page: any, ...names: string[]) =>
  propertyText(findProp(page?.properties ?? {}, ...names));

// ---------------------------------------------------------------------------
// Release cover art (canonical WebP): /media/releases/<artist>-<release>/...webp
// ---------------------------------------------------------------------------

async function handleReleaseCoverArt(req: ImageProxyRequest, res: ImageProxyResponse, rawKey: string) {
  const route = "/api/image-proxy?releaseKey";
  if (!isReadMethod(req)) return sendMediaError(res, 405, "Method not allowed.");
  const key = normalizeCompositeKey(rawKey);
  if (!key) return sendMediaError(res, 404, "Not found.");

  try {
    requireEnv(route, ["NOTION_TOKEN", "NOTION_RELEASES_DB_ID", "NOTION_ARTISTS_DB_ID"]);
    const [artistPages, releasePages] = await Promise.all([
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases),
    ]);
    const match = matchReleaseByCompositeKey(releasePages, artistSlugMap(artistPages), key);
    const page = match.page;
    if (!page) return sendMediaError(res, 404, "Not found.");

    // Show on website + Release Date (Europe/London) — the API's own rules.
    const artistLookup = new Map(artistPages.map((p: any) => [p.id, normalizeArtist(p)]));
    const release = normalizeRelease(page, artistLookup);
    if (!isReleasePublished(release)) return sendMediaError(res, 404, "Not found.");

    const sourceUrl = firstFileUrl(findProp(page.properties ?? {}, "Cover Art"));
    if (!sourceUrl) return sendMediaError(res, 404, "Not found.");

    return serveNotionImage(req, res, {
      route,
      sourceUrl,
      filenameSlug: `${[release.artistName, release.title].filter(Boolean).join(" ")} cover art`,
      context: { key },
    });
  } catch (error) {
    logApiError(route, error, { key, stage: "handler" });
    return sendMediaError(res, 500, "Image request failed.");
  }
}

// ---------------------------------------------------------------------------
// Store product images: /media/store/<store-key>/<product>.webp
// ---------------------------------------------------------------------------

async function handleStoreImage(req: ImageProxyRequest, res: ImageProxyResponse, rawKey: string) {
  const route = "/api/image-proxy?storeKey";
  if (!isReadMethod(req)) return sendMediaError(res, 405, "Method not allowed.");
  const key = keySegment(decodeURIComponent(rawKey ?? "")) || compactId(rawKey ?? "");
  if (!key) return sendMediaError(res, 404, "Not found.");

  try {
    requireEnv(route, ["NOTION_TOKEN", "NOTION_STORE_DB_ID"]);
    const pages = await loadAll(notion, DBS.storeItems);
    const page = pages.find((p: any) => {
      const slug = keySegment(propertyTextOf(p, "Store Slug", "Slug"));
      return (slug && slug === key) || compactId(String(p.id)) === compactId(key);
    });
    if (!page) return sendMediaError(res, 404, "Not found.");

    // Same public visibility rules as /api/notion/store (fails closed).
    const props = page.properties ?? {};
    const publishedProp = findProp(props, "Published");
    const published = publishedProp?.type === "checkbox" ? publishedProp.checkbox === true : false;
    const availability = findProp(props, "Availability")?.select?.name ?? "";
    if (!published || availability === "Hidden") return sendMediaError(res, 404, "Not found.");

    // No own Product Image => nothing to serve here; the normaliser points such
    // items at the release's permanent cover-art URL instead.
    const sourceUrl = firstFileUrl(findProp(props, "Product Image"));
    if (!sourceUrl) return sendMediaError(res, 404, "Not found.");

    const titleProp = Object.values(props).find((p: any) => p?.type === "title");
    const title = propertyText(titleProp);
    return serveNotionImage(req, res, { route, sourceUrl, filenameSlug: title || key, context: { key } });
  } catch (error) {
    logApiError(route, error, { key, stage: "handler" });
    return sendMediaError(res, 500, "Image request failed.");
  }
}

// ---------------------------------------------------------------------------
// Journal images: /media/journal/<slug>/cover/<title>.webp
//                 /media/journal/<slug>/images/<block-id>/<name>.webp
// ---------------------------------------------------------------------------

/** Restore dashes in a compacted Notion UUID so the API accepts it. */
const uuidFromCompact = (raw: string): string => {
  const c = compactId(raw);
  if (c.length !== 32) return "";
  return `${c.slice(0, 8)}-${c.slice(8, 12)}-${c.slice(12, 16)}-${c.slice(16, 20)}-${c.slice(20)}`;
};

async function handleJournalImage(
  req: ImageProxyRequest,
  res: ImageProxyResponse,
  rawSlug: string,
  rawBlockId: string | undefined,
) {
  const route = "/api/image-proxy?journalSlug";
  if (!isReadMethod(req)) return sendMediaError(res, 405, "Method not allowed.");
  const slug = keySegment(decodeURIComponent(rawSlug ?? ""));
  if (!slug) return sendMediaError(res, 404, "Not found.");

  try {
    requireEnv(route, ["NOTION_TOKEN", "NOTION_JOURNAL_DB_ID"]);
    const pages = await loadAll(notion, DBS.journal);
    const match = pages
      .map((p: any) => ({ page: p, article: normalizeJournal(p) }))
      .find((x: any) => keySegment(x.article.slug) === slug || compactId(x.page.id) === compactId(slug));
    if (!match) return sendMediaError(res, 404, "Not found.");

    // Published + Publish Date arrived — drafts and future articles 404.
    if (!isJournalPublished(match.article)) return sendMediaError(res, 404, "Not found.");

    if (!rawBlockId) {
      const sourceUrl = firstFileUrl(findProp(match.page.properties ?? {}, "Cover Image"));
      if (!sourceUrl) return sendMediaError(res, 404, "Not found.");
      return serveNotionImage(req, res, {
        route,
        sourceUrl,
        filenameSlug: match.article.title || slug,
        context: { slug, role: "cover" },
      });
    }

    const blockId = uuidFromCompact(rawBlockId);
    if (!blockId) return sendMediaError(res, 404, "Not found.");

    let block: any;
    try {
      block = await notion.blocks.retrieve({ block_id: blockId });
    } catch {
      return sendMediaError(res, 404, "Not found.");
    }
    // The block must genuinely belong to this article.
    const parentPage = String(block?.parent?.page_id ?? "");
    if (block?.type !== "image" || compactId(parentPage) !== compactId(match.page.id)) {
      return sendMediaError(res, 404, "Not found.");
    }
    const img = block.image;
    const sourceUrl = (img?.type === "external" ? img.external?.url : img?.file?.url) ?? "";
    if (!sourceUrl) return sendMediaError(res, 404, "Not found.");

    const caption = (img?.caption ?? []).map((t: any) => t?.plain_text ?? "").join("").trim();
    return serveNotionImage(req, res, {
      route,
      sourceUrl,
      filenameSlug: caption || match.article.title || slug,
      context: { slug, blockId },
    });
  } catch (error) {
    logApiError(route, error, { slug, stage: "handler" });
    return sendMediaError(res, 500, "Image request failed.");
  }
}


export default async function handler(req: ImageProxyRequest, res: ImageProxyResponse) {
  const releaseSlug = getQueryValue(req.query.releaseSlug);
  if (releaseSlug) return handleReleaseArtwork(req, res, releaseSlug);

  const galleryId = getQueryValue(req.query.galleryId);
  if (galleryId) return handleGalleryImage(req, res, galleryId);

  const artistSlug = getQueryValue(req.query.artistSlug);
  if (artistSlug) {
    return handleArtistImage(
      req,
      res,
      artistSlug,
      getQueryValue(req.query.role) ?? "hero",
      getQueryValue(req.query.index),
    );
  }

  const releaseKeyParam = getQueryValue(req.query.releaseKey);
  if (releaseKeyParam) return handleReleaseCoverArt(req, res, releaseKeyParam);

  const storeKey = getQueryValue(req.query.storeKey);
  if (storeKey) return handleStoreImage(req, res, storeKey);

  const journalSlug = getQueryValue(req.query.journalSlug);
  if (journalSlug) return handleJournalImage(req, res, journalSlug, getQueryValue(req.query.blockId));

  const rawUrl = getQueryValue(req.query.url);
  const width = pickWidth(getQueryValue(req.query.w));
  const wantBlur = getQueryValue(req.query.blur) === "1";


  if (!rawUrl) return sendError(res, 400, "Missing image URL.");
  if (!isAllowedImageUrl(rawUrl)) return sendError(res, 400, "Unsupported image URL.");
  if (wantsHtmlViewer(req)) return sendHtmlViewer(req, res, rawUrl);

  try {
    const source = await fetch(rawUrl, {
      headers: { Accept: "image/avif,image/webp,image/*,*/*;q=0.8" },
    });

    if (!source.ok) return sendError(res, source.status, "Could not fetch image.");

    const sourceContentType = source.headers.get("content-type") || "application/octet-stream";
    if (!sourceContentType.startsWith("image/")) {
      return sendError(res, 415, "Source is not an image.");
    }

    const sourceBuffer = Buffer.from(await source.arrayBuffer());

    // No transform requested — passthrough (preserves SVGs, GIFs, etc.).
    if (!width && !wantBlur) {
      res.writeHead(200, {
        "Cache-Control": CACHE_CONTROL,
        "Content-Type": sourceContentType,
        "Content-Disposition": "inline",
        "Link": WMG_FAVICON_LINK,
        "X-Content-Type-Options": "nosniff",
        "Content-Length": String(sourceBuffer.length),
      }).end(sourceBuffer as unknown as string);
      return;
    }

    let pipeline = sharp(sourceBuffer, { failOn: "none" }).rotate();

    if (wantBlur) {
      pipeline = pipeline
        .resize({ width: 24, withoutEnlargement: true })
        .blur(2)
        .webp({ quality: 30 });
    } else if (width) {
      pipeline = pipeline
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: DEFAULT_QUALITY });
    }

    const output = await pipeline.toBuffer();

    res.writeHead(200, {
      "Cache-Control": CACHE_CONTROL,
      "Content-Type": "image/webp",
      "Content-Disposition": "inline",
      "Link": WMG_FAVICON_LINK,
      "X-Content-Type-Options": "nosniff",
      "Content-Length": String(output.length),
    }).end(output as unknown as string);
  } catch (error) {
    console.error("[image-proxy] Failed to proxy image", error);
    return sendError(res, 502, "Image proxy failed.");
  }
}
