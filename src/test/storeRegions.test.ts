import { describe, it, expect, vi, afterEach } from "vitest";
import { EU_COUNTRIES, regionForCountry, validPreference } from "../lib/storeRegion";
import { localizeStoreItem } from "../lib/storePricing";
import { handleStoreContext } from "../../api/notion/_storeRegion";
import { normalizeStoreItem } from "../../api/notion/_normalize";
import { storeProduct } from "../lib/schema";
import type { StoreItem } from "../lib/types";

const item = {
  id: "test", title: "Record", formats: ["Vinyl", "CD", "iTunes"],
  prices: { Vinyl: "£27.90", CD: "£13.90", iTunes: "£7.99" },
  regionalPrices: { USD: { Vinyl: "US$31.90", CD: "US$15.90" }, EUR: { Vinyl: "€32.90", CD: "€16.40" } },
  purchaseLink: "https://elasticstage.com/bobbychills/releases/midnight-dont-answer-album",
  displayPriceSummary: true, availability: "Available Now",
} as StoreItem;
afterEach(() => vi.unstubAllGlobals());

describe("region defaults", () => {
  it("gives US visitors their own category", () => expect(regionForCountry("US")).toEqual({ region: "US", currency: "USD" }));
  it("uses GBP in the UK", () => expect(regionForCountry("gb")).toEqual({ region: "UK", currency: "GBP" }));
  it.each([...EU_COUNTRIES])("uses EUR for EU member %s", country => expect(regionForCountry(country)).toEqual({ region: "EU", currency: "EUR" }));
  it.each(["CA", "AU", "JP", "CH", "NO", "AD", "GG", "NZ", "IN"])("uses USD for International country %s", country => expect(regionForCountry(country)).toEqual({ region: "INTL", currency: "USD" }));
  it("falls back safely when country is unavailable", () => expect(regionForCountry()).toEqual({ region: "INTL", currency: "USD" }));
  it("rejects invalid saved preferences", () => {
    expect(validPreference({ region: "US", currency: "CAD" })).toBe(false);
    expect(validPreference({ region: "INTL", currency: "INVALID" })).toBe(false);
    expect(validPreference({ region: "INTL", currency: "CAD" })).toBe(false);
    expect(validPreference({ region: "INTL", currency: "USD" })).toBe(true);
  });
});

describe("published price buckets", () => {
  it("uses fixed USD and EUR amounts, never exchange conversions", () => {
    expect(localizeStoreItem(item, { region: "US", currency: "USD" }).prices.Vinyl).toBe("US$31.90");
    expect(localizeStoreItem(item, { region: "EU", currency: "EUR" }).prices.Vinyl).toBe("€32.90");
    expect(localizeStoreItem(item, { region: "UK", currency: "GBP" }).prices.iTunes).toBe("£7.99");
  });
  it("does not invent regional iTunes prices or alter source data", () => {
    const localized = localizeStoreItem(item, { region: "US", currency: "USD" });
    expect(localized.prices.iTunes).toBeUndefined();
    expect(localized.purchaseLink).toBe(item.purchaseLink);
    expect(item.prices.Vinyl).toBe("£27.90");
  });
  it("uses the published USD bucket for International without conversion", () => {
    const localized = localizeStoreItem(item, { region: "INTL", currency: "USD" });
    expect(localized.prices).toEqual({ Vinyl: "US$31.90", CD: "US$15.90" });
    expect(localized.priceSummary).toBe("From US$15.90");
    expect(localized.purchaseLink).toBe(item.purchaseLink);
  });
  it("rejects prices labelled in the wrong currency", () => {
    const wrong = { ...item, regionalPrices: { USD: { CD: "£13.90" } } };
    expect(localizeStoreItem(wrong, { region: "US", currency: "USD" }).prices).toEqual({});
  });
  it("produces fixed-currency search offers matching the visible amounts", () => {
    const schema = storeProduct(localizeStoreItem(item, { region: "EU", currency: "EUR" })) as any;
    expect(schema.offers.priceCurrency).toBe("EUR");
    expect(schema.offers.offers.map((o: any) => o.price)).toEqual(["32.90", "16.40"]);
  });
  it("can omit retailer offers for international reference prices", () => expect(storeProduct({ ...item, prices: {} })).not.toHaveProperty("offers"));
});

describe("public store context", () => {
  function capture() {
    const result = { status: 0, headers: {} as Record<string, string>, body: "" };
    const res = { writeHead(status: number, headers: Record<string, string>) { Object.assign(result, { status, headers }); return { end(body: string) { result.body = body; } }; } };
    return { result, res };
  }
  it("isolates per-visitor country data from the shared catalogue cache", async () => {
    for (const [country, region] of [["US", "US"], ["GB", "UK"], ["FR", "EU"], ["CA", "INTL"]]) {
      const { result, res } = capture();
      await handleStoreContext({ query: { context: "region" }, headers: { "x-vercel-ip-country": country } }, res);
      expect(JSON.parse(result.body).region).toBe(region);
      expect(result.headers["Cache-Control"]).toBe("private, no-store");
      expect(result.headers["Vercel-CDN-Cache-Control"]).toBe("no-store");
    }
  });
  it("passes normal catalogue requests through", async () => expect(await handleStoreContext({ query: {} }, capture().res)).toBe(false));
  it("retires the old rates route without fetching a provider", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const { result, res } = capture();
    expect(await handleStoreContext({ query: { context: "rates" } }, res)).toBe(true);
    expect(result.status).toBe(410);
    expect(fetch).not.toHaveBeenCalled();
  });
});

it("reads fixed regional prices directly from the Notion columns", () => {
  const rich = (content: string) => ({ type: "rich_text", rich_text: [{ plain_text: content, text: { content } }] });
  const result = normalizeStoreItem({ id: "fixture", properties: {
    "Price - CD": rich("£13.90"), "Price - CD - USD": rich("US$15.90"), "Price - CD - EUR": rich("€16.40"),
  } }, { artistLookup: new Map(), releaseLookup: new Map(), trackLookup: new Map() });
  expect(result.prices.CD).toBe("£13.90");
  expect(result.regionalPrices).toEqual({ USD: { CD: "US$15.90" }, EUR: { CD: "€16.40" } });
});
