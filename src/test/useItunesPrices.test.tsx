import { act, cleanup, render, renderHook, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { StoreCard } from "../components/StoreCard";
import { useItunesPrices } from "../hooks/use-itunes-prices";
import { fetchItunesPrices, fetchStoreContext } from "../lib/api";
import { useStoreRegion, STORE_COUNTRY_KEY } from "../hooks/use-store-region";
import { applyItunesPrices } from "../lib/itunes";
import type { StoreItem } from "../lib/types";
vi.mock("../lib/api", () => ({ fetchItunesPrices: vi.fn(), fetchStoreContext: vi.fn() }));
vi.mock("../lib/queries", () => ({ useTracks: () => ({}), useReleases: () => ({}) }));
const fetchPrices = vi.mocked(fetchItunesPrices);
function wrapper({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } }));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
import React from "react";
beforeEach(() => {
  localStorage.clear(); fetchPrices.mockReset();
  vi.mocked(fetchStoreContext).mockResolvedValue({ country: "PL" });
  fetchPrices.mockImplementation(async country => { const now = Date.now(); return { country, checkedAt: new Date(now).toISOString(), expiresAt: new Date(now + 86400000).toISOString(), offers: {} }; });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function useShop() {
  const region = useStoreRegion();
  return { region, itunes: useItunesPrices(region.country, true) };
}
it("changes physical buckets and the Apple storefront together, retaining country-specific currencies", async () => {
  const { result } = renderHook(useShop, { wrapper });
  await waitFor(() => expect(result.current.itunes.data?.country).toBe("PL"));
  expect(result.current.region.selected.currency).toBe("EUR");
  act(() => result.current.region.chooseCountry("CA"));
  expect(result.current.itunes.data).toBeUndefined();
  await waitFor(() => expect(result.current.itunes.data?.country).toBe("CA"));
  expect(result.current.region.selected).toEqual({ region: "INTL", currency: "USD" });
  expect(localStorage.getItem(STORE_COUNTRY_KEY)).toBe("CA");
  act(() => result.current.region.chooseCountry("US"));
  await waitFor(() => expect(result.current.itunes.data?.country).toBe("US"));
  expect(result.current.region.selected.region).toBe("US");
  act(() => result.current.region.chooseCountry(null));
  await waitFor(() => expect(result.current.itunes.data?.country).toBe("PL"));
  expect(result.current.region.selected.currency).toBe("EUR");
});
it("restores one saved country for both formats", async () => {
  localStorage.setItem(STORE_COUNTRY_KEY, "GB");
  const { result } = renderHook(useShop, { wrapper });
  await waitFor(() => expect(result.current.itunes.data?.country).toBe("GB"));
  expect(result.current.region.selected.currency).toBe("GBP");
  expect(fetchPrices.mock.calls.every(call => call[0] === "GB")).toBe(true);
});
it("does not silently use the US Apple store when location is unknown", async () => {
  const { result } = renderHook(() => useItunesPrices(null, true), { wrapper });
  expect(result.current.country).toBeNull();
  expect(fetchPrices).not.toHaveBeenCalled();
});
it("hides expired responses", async () => {
  fetchPrices.mockResolvedValue({ country: "GB", checkedAt: "2020-01-01T00:00:00Z", expiresAt: "2020-01-02T00:00:00Z", offers: {} });
  const { result } = renderHook(() => useItunesPrices("GB", true), { wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.data).toBeUndefined();
});

it("shows checking during a new lookup and reserves the fallback for an unavailable quote", async () => {
  const item = {
    id: "record", title: "Record", availability: "Available Now", formats: ["iTunes"],
    prices: {}, relatedTracks: [], appleMusicUrl: "https://music.apple.com/gb/album/record/123",
  } as StoreItem;
  let finish: (value: Awaited<ReturnType<typeof fetchItunesPrices>>) => void;
  fetchPrices.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
  const now = Date.now();
  const quote = {
    country: "PL", checkedAt: new Date(now).toISOString(), expiresAt: new Date(now + 86400000).toISOString(),
    offers: { record: { amount: 29.99, currency: "PLN", url: "https://music.apple.com/pl/album/record/123?app=itunes" } },
  };
  fetchPrices.mockRejectedValueOnce(new Error("iTunes unavailable"));

  function PriceCard({ country }: { country: string }) {
    const price = useItunesPrices(country, true);
    return <StoreCard item={applyItunesPrices(item, price.data, country)} itunesPriceLoading={price.loading} />;
  }
  const view = render(<PriceCard country="PL" />, { wrapper });
  expect(screen.getByText("Checking price…")).toHaveAttribute("href", quote.offers.record.url);
  expect(screen.queryByText("See price on iTunes")).toBeNull();
  await act(async () => finish(quote));
  expect(await screen.findByText("PLN 29.99")).toHaveAttribute("href", quote.offers.record.url);

  view.rerender(<PriceCard country="GB" />);
  expect(screen.queryByText("PLN 29.99")).toBeNull();
  expect(await screen.findByText("See price on iTunes")).toHaveAttribute("href", "https://music.apple.com/gb/album/record/123?app=itunes");

  view.rerender(<PriceCard country="PL" />);
  expect(screen.getByText("PLN 29.99")).toBeInTheDocument();
  expect(fetchPrices.mock.calls.map(([country]) => country)).toEqual(["PL", "GB"]);
});
