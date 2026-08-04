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

export default async function handler(req: ImageProxyRequest, res: ImageProxyResponse) {
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
