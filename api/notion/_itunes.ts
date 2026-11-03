import { appleAlbumId, ITUNES_DAY_MS, type ItunesPrices, type ItunesOffer } from "../../src/lib/itunes.js";

type Item = { id: string; formats: string[]; appleMusicUrl?: string | null };
// CDN is the shared cache. This bounded warm-instance cache also coalesces misses.
const cache = new Map<string, ItunesPrices>();
const pending = new Map<string, Promise<ItunesPrices>>();
let lastRequest = 0;

export function appleOffer(row: any, country: string, id: string): ItunesOffer | null {
  const track = row?.wrapperType === "track" && row.kind === "song";
  const amount = track ? row.trackPrice : row?.collectionPrice;
  if ((!track && row?.wrapperType !== "collection") || String(track ? row.trackId : row.collectionId) !== id ||
      typeof amount !== "number" || !Number.isFinite(amount) || amount < 0 ||
      typeof row.currency !== "string" || !/^[A-Z]{3}$/.test(row.currency)) return null;
  try {
    const url = new URL(track ? row.trackViewUrl : row.collectionViewUrl);
    if (appleAlbumId(url.href) !== id || url.pathname.split("/")[1]?.toUpperCase() !== country) return null;
    // Ask Apple's link to open the purchase store, rather than a streaming subscription.
    url.searchParams.set("app", "itunes");
    return { amount, currency: row.currency, url: url.href };
  } catch { return null; }
}

export async function getItunesPrices(items: Item[], country: string): Promise<ItunesPrices> {
  const mapped = items.filter(item => item.formats.includes("iTunes"))
    .map(item => ({ itemId: item.id, albumId: appleAlbumId(item.appleMusicUrl) })).filter(item => item.albumId);
  const ids = [...new Set(mapped.map(item => item.albumId!))].sort();
  // Bound catalogue size and request length; no arbitrary public ID lookup proxy.
  if (ids.length > 200) throw new Error("iTunes catalogue exceeds lookup batch limit");
  const key = `${country}:${mapped.map(item => `${item.itemId}:${item.albumId}`).sort().join(",")}`;
  const saved = cache.get(key);
  if (saved && Date.parse(saved.expiresAt) > Date.now()) return saved;
  if (pending.has(key)) return pending.get(key)!;
  const task = (async () => {
    let rows: any[] = [];
    if (ids.length) {
      // Below Apple's approximately 20/minute limit for this instance. Other
      // instances share country-specific CDN responses; 429 is handled as unavailable.
      const start = Math.max(Date.now(), lastRequest + 3500);
      if (start - Date.now() > 15000) throw new Error("iTunes lookup busy");
      lastRequest = start;
      if (start > Date.now()) await new Promise(resolve => setTimeout(resolve, start - Date.now()));
      const url = new URL("https://itunes.apple.com/lookup");
      url.searchParams.set("id", ids.join(","));
      url.searchParams.set("country", country.toLowerCase());
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error(`iTunes lookup failed (${response.status})`);
      const body = await response.json() as { results?: unknown };
      if (!Array.isArray(body.results)) throw new Error("Invalid iTunes response");
      rows = body.results;
    }
    const offers: Record<string, ItunesOffer> = {};
    for (const item of mapped) {
      const row = rows.find(row => String(row.wrapperType === "track" ? row.trackId : row.collectionId) === item.albumId);
      const offer = appleOffer(row, country, item.albumId!);
      if (offer) offers[item.itemId] = offer;
    }
    const now = Date.now();
    const result = { country, checkedAt: new Date(now).toISOString(), expiresAt: new Date(now + ITUNES_DAY_MS).toISOString(), offers };
    if (cache.size >= 250) cache.delete(cache.keys().next().value!);
    cache.set(key, result);
    return result;
  })();
  pending.set(key, task);
  try { return await task; } finally { pending.delete(key); }
}
