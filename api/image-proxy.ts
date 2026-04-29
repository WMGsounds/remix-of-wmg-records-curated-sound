import type { ApiRequest, ApiResponse } from "./notion/_client.js";

const CACHE_CONTROL = "public, max-age=31536000, s-maxage=31536000, immutable";
const ALLOWED_HOSTS = new Set([
  "prod-files-secure.s3.us-west-2.amazonaws.com",
  "s3.us-west-2.amazonaws.com",
]);

type ImageProxyResponse = ApiResponse & {
  setHeader?: (name: string, value: string) => void;
  status?: (code: number) => { json: (body: unknown) => void; end?: (body?: string) => void };
  end?: (body?: Buffer | string) => void;
};

const sendError = (res: ImageProxyResponse, status: number, message: string) => {
  if (res.setHeader) res.setHeader("Cache-Control", "no-store");
  return res.status?.(status).json({ error: message });
};

const getSingleQueryValue = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

const isAllowedImageUrl = (rawUrl: string) => {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === "https:" && ALLOWED_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
};

export default async function handler(req: ApiRequest, res: ImageProxyResponse) {
  const rawUrl = getSingleQueryValue(req.query.url);

  if (!rawUrl) return sendError(res, 400, "Missing image URL.");
  if (!isAllowedImageUrl(rawUrl)) return sendError(res, 400, "Unsupported image URL.");

  try {
    const source = await fetch(rawUrl, {
      headers: {
        Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
      },
    });

    if (!source.ok) {
      return sendError(res, source.status, "Could not fetch image.");
    }

    const contentType = source.headers.get("content-type") || "application/octet-stream";
    if (!contentType.startsWith("image/")) {
      return sendError(res, 415, "Source is not an image.");
    }

    const body = Buffer.from(await source.arrayBuffer());

    res.writeHead(200, {
      "Cache-Control": CACHE_CONTROL,
      "Content-Type": contentType,
      "Content-Length": String(body.length),
    }).end(body as unknown as string);
  } catch (error) {
    console.error("[image-proxy] Failed to proxy image", error);
    return sendError(res, 502, "Image proxy failed.");
  }
}
