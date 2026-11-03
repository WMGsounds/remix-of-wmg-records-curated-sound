import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useItunesPrices } from "../hooks/use-itunes-prices";
import { fetchItunesPrices, fetchStoreContext } from "../lib/api";
import { useStoreRegion, STORE_COUNTRY_KEY } from "../hooks/use-store-region";
vi.mock("../lib/api", () => ({ fetchItunesPrices: vi.fn(), fetchStoreContext: vi.fn() }));
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
