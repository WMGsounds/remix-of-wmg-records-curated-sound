import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useItunesPrices, ITUNES_COUNTRY_KEY } from "../hooks/use-itunes-prices";
import { fetchItunesPrices } from "../lib/api";
import { STORE_REGION_KEY } from "../hooks/use-store-region";
vi.mock("../lib/api", () => ({ fetchItunesPrices: vi.fn() }));
const fetchPrices = vi.mocked(fetchItunesPrices);
function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
beforeEach(() => { localStorage.clear(); fetchPrices.mockReset(); fetchPrices.mockImplementation(async country => ({ country, checkedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString(), offers: {} })); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it("uses the actual country, persists an override and leaves physical preferences untouched", async () => {
  const physical = JSON.stringify({ region: "EU", currency: "EUR" });
  localStorage.setItem(STORE_REGION_KEY, physical);
  const { result, rerender } = renderHook(({ detected }) => useItunesPrices(detected, true), { initialProps: { detected: "PL" }, wrapper });
  await waitFor(() => expect(result.current.data?.country).toBe("PL"));
  act(() => result.current.choose("CA"));
  expect(result.current.data).toBeUndefined();
  await waitFor(() => expect(result.current.data?.country).toBe("CA"));
  rerender({ detected: "US" });
  expect(result.current.country).toBe("CA");
  expect(localStorage.getItem(ITUNES_COUNTRY_KEY)).toBe("CA");
  expect(localStorage.getItem(STORE_REGION_KEY)).toBe(physical);
  act(() => result.current.choose(null));
  await waitFor(() => expect(result.current.data?.country).toBe("US"));
});
it("restores a saved Apple store independently of geolocation", async () => {
  localStorage.setItem(ITUNES_COUNTRY_KEY, "JP");
  const { result } = renderHook(() => useItunesPrices("GB", true), { wrapper });
  await waitFor(() => expect(result.current.data?.country).toBe("JP"));
  expect(fetchPrices.mock.calls.every(call => call[0] === "JP")).toBe(true);
});
it("does not silently use the US store when location is unknown", async () => {
  const { result } = renderHook(() => useItunesPrices(null, true), { wrapper });
  expect(result.current.country).toBeNull();
  expect(fetchPrices).not.toHaveBeenCalled();
  act(() => result.current.choose("GB"));
  await waitFor(() => expect(result.current.data?.country).toBe("GB"));
});
it("hides expired responses", async () => {
  fetchPrices.mockResolvedValue({ country: "GB", checkedAt: "2020-01-01T00:00:00Z", expiresAt: "2020-01-02T00:00:00Z", offers: {} });
  const { result } = renderHook(() => useItunesPrices("GB", true), { wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.data).toBeUndefined();
});
