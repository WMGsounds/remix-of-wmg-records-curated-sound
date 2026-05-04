import sharp from "sharp";
import type { ApiRequest, ApiResponse } from "./notion/_client.js";

// Browsers cache the resized result for a year (URL is unique per width).
// CDN keeps it hot, with stale-while-revalidate as a safety net.
const CACHE_CONTROL = "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable";
const WMG_FAVICON_LINK = '</favicon.ico?v=wmg-3>; rel="icon"; type="image/x-icon"';
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

export default async function handler(req: ApiRequest, res: ImageProxyResponse) {
  const rawUrl = getQueryValue(req.query.url);
  const width = pickWidth(getQueryValue(req.query.w));
  const wantBlur = getQueryValue(req.query.blur) === "1";

  if (!rawUrl) return sendError(res, 400, "Missing image URL.");
  if (!isAllowedImageUrl(rawUrl)) return sendError(res, 400, "Unsupported image URL.");

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
