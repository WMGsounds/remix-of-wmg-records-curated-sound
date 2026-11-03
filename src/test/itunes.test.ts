// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appleAlbumId, applyItunesPrices, freshItunesPrices, ITUNES_DAY_MS } from "../lib/itunes";
import { localizeStoreItem } from "../lib/storePricing";
import { storeProduct } from "../lib/schema";
import type { StoreItem } from "../lib/types";

const album = { wrapperType: "collection", collectionId: 123, collectionPrice: 29.99, currency: "PLN", collectionViewUrl: "https://music.apple.com/pl/album/record/123" };
const items = [{ id: "wmg", formats: ["iTunes"], appleMusicUrl: "https://music.apple.com/us/album/record/123" }];
beforeEach(() => { vi.resetModules(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-03T12:00:00Z")); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it("matches exact Apple album and song links but rejects lookalike hosts", () => {
  expect(appleAlbumId(items[0].appleMusicUrl)).toBe("123");
  expect(appleAlbumId("https://music.apple.com/us/song/single/456")).toBe("456");
  expect(appleAlbumId("https://music.apple.com/us/album/single/123?i=456")).toBe("456");
  expect(appleAlbumId("https://music.apple.com.evil.test/us/album/record/123")).toBeNull();
});

describe("daily Apple lookup", () => {
  it("batches exact IDs, coalesces concurrent requests and refreshes after 24 hours", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [album] }) });
    vi.stubGlobal("fetch", fetch);
    const { getItunesPrices } = await import("../../api/notion/_itunes");
    const [first, concurrent] = await Promise.all([getItunesPrices(items, "PL"), getItunesPrices(items, "PL")]);
    expect(first).toEqual(concurrent);
    expect(first.offers.wmg).toMatchObject({ amount: 29.99, currency: "PLN" });
    expect(first.offers.wmg.url).toContain("/pl/album/");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(String(fetch.mock.calls[0][0])).toBe("https://itunes.apple.com/lookup?id=123&country=pl");
    await getItunesPrices(items, "PL");
    expect(fetch).toHaveBeenCalledTimes(1);
    vi.setSystemTime(Date.now() + ITUNES_DAY_MS + 1);
    const refreshed = await getItunesPrices(items, "PL");
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(refreshed.checkedAt).not.toBe(first.checkedAt);
    expect(freshItunesPrices(first, "PL")).toBe(false);
  });
  it("isolates country caches and never serves an expired success after Apple fails", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [album] }) });
    vi.stubGlobal("fetch", fetch);
    const { getItunesPrices } = await import("../../api/notion/_itunes");
    const first = await getItunesPrices(items, "PL");
    vi.setSystemTime(Date.now() + 4000);
    const us = await getItunesPrices(items, "US");
    expect(us.offers).toEqual({}); // PL result is not a US price.
    vi.setSystemTime(Date.now() + ITUNES_DAY_MS);
    fetch.mockResolvedValue({ ok: false, status: 429 });
    await expect(getItunesPrices(items, "PL")).rejects.toThrow("429");
    expect(freshItunesPrices(first, "PL")).toBe(false);
  });
  it("rejects wrong IDs, wrong countries, unavailable prices and unsafe purchase links", async () => {
    const { appleOffer } = await import("../../api/notion/_itunes");
    expect(appleOffer(album, "PL", "123")).toBeTruthy();
    expect(appleOffer(album, "GB", "123")).toBeNull();
    expect(appleOffer(album, "PL", "456")).toBeNull();
    expect(appleOffer({ ...album, collectionPrice: -1 }, "PL", "123")).toBeNull();
    expect(appleOffer({ ...album, collectionPrice: null }, "PL", "123")).toBeNull();
    expect(appleOffer({ ...album, collectionViewUrl: "https://example.com/pl/album/record/123" }, "PL", "123")).toBeNull();
  });
  it("uses trackPrice for a single-song URL, never the enclosing album price", async () => {
    const { appleOffer } = await import("../../api/notion/_itunes");
    expect(appleOffer({ wrapperType: "track", kind: "song", trackId: 456, collectionId: 123,
      trackPrice: 1.29, collectionPrice: 9.99, currency: "USD",
      trackViewUrl: "https://music.apple.com/us/album/record/123?i=456" }, "US", "456")?.amount).toBe(1.29);
  });
});

it("keeps physical EUR prices while showing Polish iTunes prices and excludes Apple from physical Offer schema", () => {
  const item = { ...items[0], title: "Record", availability: "Available Now", formats: ["Vinyl", "CD", "iTunes"],
    prices: { Vinyl: "£10.00", iTunes: "£7.99" }, regionalPrices: { EUR: { Vinyl: "€20.00", CD: "€10.00" } },
    purchaseLink: "https://elasticstage.com/example", displayPriceSummary: true } as StoreItem;
  const prices = { country: "PL", checkedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + ITUNES_DAY_MS).toISOString(),
    offers: { wmg: { amount: 29.99, currency: "PLN", url: album.collectionViewUrl } } };
  const localized = applyItunesPrices(localizeStoreItem(item, { region: "EU", currency: "EUR" }), prices, "PL");
  expect(localized.prices).toEqual({ Vinyl: "€20.00", CD: "€10.00", iTunes: "PLN\u00a029.99" });
  expect(localized.priceSummary).toBe("From €10.00");
  expect((storeProduct(localized) as any).offers.offers).toHaveLength(2);
  expect(applyItunesPrices(item, undefined, "PL").prices.iTunes).toBeUndefined();
  expect(freshItunesPrices(prices, "GB")).toBe(false);
});
