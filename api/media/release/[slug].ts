import sharp from "sharp";
import { notion, DBS, logApiError, logApiSuccess, requireEnv, type ApiRequest, type ApiResponse } from "../../notion/_client.js";

// Permanent public cover-art endpoint.
//   /api/media/release/heaven-in-your-arms.jpg
// The public URL is stable; the current (temporary) Notion file URL is resolved
// server-side on every CDN revalidation and never exposed to the client.

type MediaResponse = ApiResponse & {
  setHeader?: (name: string, value: string) => void;
  end?: (body?: Buffer | string) => void;
};

type MediaRequest = ApiRequest & { method?: string };

// ~1h freshness so replacing Cover Art in Notion propagates within the hour,
// with stale-while-revalidate so visitors never wait on a Notion round-trip.
const CACHE_CONTROL = "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400";

const IMAGE_HEADERS = {
  "Content-Type": "image/jpeg",
  "Content-Disposition": "inline",
  "Access-Control-Allow-Origin": "*",
  "X-Content-Type-Options": "nosniff",
  "Cache-Control": CACHE_CONTROL,
};

const getQueryValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const stripExtension = (raw: string) =>
  raw.replace(/\.(jpg|jpeg|png|webp)$/i, "");

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

const sendError = (res: MediaResponse, status: number, message: string) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "X-Content-Type-Options": "nosniff",
  }).end(JSON.stringify({ error: message }));
};

async function findReleasePage(slug: string) {
  // Prefer a targeted query; fall back to a full scan if Slug isn't rich_text.
  try {
    const r: any = await (notion as any).databases.query({
      database_id: DBS.releases,
      filter: { property: "Slug", rich_text: { equals: slug } },
      page_size: 5,
    });
    if (r?.results?.length) return r.results[0];
  } catch {
    /* fall through to full scan */
  }

  let cursor: string | undefined;
  do {
    const r: any = await (notion as any).databases.query({
      database_id: DBS.releases,
      start_cursor: cursor,
      page_size: 100,
    });
    for (const page of r.results ?? []) {
      const props = page.properties ?? {};
      if (plain(findProp(props, "Slug")).toLowerCase() === slug.toLowerCase()) return page;
    }
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);

  return null;
}

export default async function handler(req: MediaRequest, res: MediaResponse) {
  const route = "/api/media/release/[slug]";
  const method = (req.method ?? "GET").toUpperCase();
  const raw = getQueryValue(req.query?.slug) ?? "";
  const slug = stripExtension(decodeURIComponent(raw)).trim();

  if (method !== "GET" && method !== "HEAD") {
    return sendError(res, 405, "Method not allowed.");
  }
  if (!slug) return sendError(res, 404, "Not found.");

  try {
    requireEnv(route, ["NOTION_TOKEN", "NOTION_RELEASES_DB_ID"]);

    const page = await findReleasePage(slug);
    if (!page) {
      console.warn("[media-api] Release not found", { route, slug });
      return sendError(res, 404, "Not found.");
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
      return sendError(res, 404, "Not found.");
    }

    const sourceUrl = firstFileUrl(findProp(props, "Cover Art"));
    if (!sourceUrl) {
      console.warn("[media-api] Release has no Cover Art file", { route, slug });
      return sendError(res, 404, "Not found.");
    }

    const source = await fetch(sourceUrl, {
      headers: { Accept: "image/avif,image/webp,image/*,*/*;q=0.8" },
    });
    if (!source.ok) {
      logApiError(route, new Error(`Cover art fetch failed (${source.status})`), { slug });
      return sendError(res, 502, "Could not load artwork.");
    }

    const input = Buffer.from(await source.arrayBuffer());
    const output = await sharp(input, { failOn: "none" })
      .rotate()
      .jpeg({ quality: 92, chromaSubsampling: "4:4:4", mozjpeg: true })
      .toBuffer();

    logApiSuccess(route, { slug, bytes: output.length });

    const headers = { ...IMAGE_HEADERS, "Content-Length": String(output.length) };
    if (method === "HEAD") {
      res.writeHead(200, headers).end("");
      return;
    }
    res.writeHead(200, headers).end(output as unknown as string);
  } catch (error) {
    logApiError(route, error, { slug });
    return sendError(res, 500, "Artwork request failed.");
  }
}
