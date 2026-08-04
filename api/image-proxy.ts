import sharp from "sharp";
import { notion, DBS, logApiError, logApiSuccess, requireEnv, type ApiRequest, type ApiResponse } from "./notion/_client.js";

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

const stripExtension = (raw: string) => raw.replace(/\.(jpg|jpeg|png|webp)$/i, "");

const plain = (prop: any): string => {
  if (!prop) return "";
  const parts = prop.rich_text ?? prop.title ?? [];
  return Array.isArray(parts) ? parts.map((t: any) => t.plain_text).join("").trim() : "";
};

const findProp = (props: Record<string, any>, ...names: string[]): any => {
  for (const n of names) if (props[n] !== undefined) return props[n];
  const norm = (s: string) => s.normalize("NFKC").replace(/\s+/g, "").toLowerCase();
  const targets = names.map(norm);
  for (const key of Object.keys(props)) {
    if (targets.includes(norm(key))) return props[key];
  }
  return undefined;
};

const firstFileUrl = (prop: any): string => {
  const files = prop?.files ?? [];
  for (const f of files) {
    const u = f?.type === "external" ? f.external?.url : f?.file?.url;
    if (typeof u === "string" && u.trim()) return u.trim();
  }
  return "";
};

const sendMediaError = (res: ImageProxyResponse, status: number, message: string) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "X-Content-Type-Options": "nosniff",
  }).end(JSON.stringify({ error: message }));
};

const sanitizeFilename = (value: string) =>
  value.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "artwork";

const artistSlugCache = new Map<string, string>();

async function loadArtistSlugs(): Promise<Map<string, string>> {
  if (artistSlugCache.size > 0) return artistSlugCache;
  let cursor: string | undefined;
  do {
    const r: any = await (notion as any).databases.query({
      database_id: DBS.artists,
      start_cursor: cursor,
      page_size: 100,
    });
    for (const page of r.results ?? []) {
      const slug = plain(findProp(page.properties ?? {}, "Slug"));
      if (slug) artistSlugCache.set(page.id, slug);
    }
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return artistSlugCache;
}

// Resolve a release from the composite public key `[artist-slug]-[release-slug]`.
// Both parts can contain hyphens, so we compare full built keys instead of splitting.
async function findReleasePage(compositeKey: string) {
  const target = compositeKey.toLowerCase();
  const artists = await loadArtistSlugs();

  let cursor: string | undefined;
  do {
    const r: any = await (notion as any).databases.query({
      database_id: DBS.releases,
      start_cursor: cursor,
      page_size: 100,
    });
    for (const page of r.results ?? []) {
      const props = page.properties ?? {};
      const releaseSlug = plain(findProp(props, "Slug"));
      if (!releaseSlug) continue;
      const artistId = props["Artist"]?.relation?.[0]?.id ?? "";
      const artistSlug = artists.get(artistId) ?? "";
      if (!artistSlug) continue;
      if (`${artistSlug}-${releaseSlug}`.toLowerCase() === target) return page;
    }
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);

  return null;
}


async function handleReleaseArtwork(req: ImageProxyRequest, res: ImageProxyResponse, rawSlug: string) {
  const route = "/api/image-proxy?releaseSlug";
  const method = (req.method ?? "GET").toUpperCase();
  const slug = stripExtension(decodeURIComponent(rawSlug)).trim();

  if (method !== "GET" && method !== "HEAD") {
    return sendMediaError(res, 405, "Method not allowed.");
  }
  if (!slug) return sendMediaError(res, 404, "Not found.");

  try {
    requireEnv(route, ["NOTION_TOKEN", "NOTION_RELEASES_DB_ID", "NOTION_ARTISTS_DB_ID"]);

    const page = await findReleasePage(slug);
    if (!page) {
      console.warn("[media-api] Release not found", { route, slug });
      return sendMediaError(res, 404, "Not found.");
    }

    const props = page.properties ?? {};
    const showProp = findProp(props, "Show on website", "Show on Website", "Show On Website");
    const visible = showProp?.type === "checkbox" ? showProp.checkbox === true : false;
    if (!visible) {
      console.warn("[media-api] Release hidden or missing Show on website checkbox", {
        route,
        slug,
        propertyType: showProp?.type ?? "missing",
      });
      return sendMediaError(res, 404, "Not found.");
    }

    const sourceUrl = firstFileUrl(findProp(props, "Cover Art"));
    if (!sourceUrl) {
      console.warn("[media-api] Release has no Cover Art file", { route, slug });
      return sendMediaError(res, 404, "Not found.");
    }

    const source = await fetch(sourceUrl, {
      headers: { Accept: "image/avif,image/webp,image/*,*/*;q=0.8" },
    });
    if (!source.ok) {
      logApiError(route, new Error(`Cover art fetch failed (${source.status})`), { slug });
      return sendMediaError(res, 502, "Could not load artwork.");
    }

    const input = Buffer.from(await source.arrayBuffer());
    const output = await sharp(input, { failOn: "none" })
      .rotate()
      .jpeg({ quality: 92, chromaSubsampling: "4:4:4", mozjpeg: true })
      .toBuffer();

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
    logApiError(route, error, { slug });
    return sendMediaError(res, 500, "Artwork request failed.");
  }
}

export default async function handler(req: ImageProxyRequest, res: ImageProxyResponse) {
  const releaseSlug = getQueryValue(req.query.releaseSlug);
  if (releaseSlug) return handleReleaseArtwork(req, res, releaseSlug);

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
