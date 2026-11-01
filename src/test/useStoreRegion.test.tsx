import { act, renderHook, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useStoreRegion, STORE_REGION_KEY } from "../hooks/use-store-region";
import { fetchStoreContext } from "../lib/api";
vi.mock("../lib/api", () => ({ fetchStoreContext: vi.fn() }));
const fetchContext = vi.mocked(fetchStoreContext);
function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
beforeEach(() => { localStorage.clear(); fetchContext.mockReset(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it("never overwrites a manual US choice when a slower country lookup finishes", async () => {
  let resolve!: (value: unknown) => void;
  fetchContext.mockReturnValue(new Promise(r => { resolve = r; }));
  const { result } = renderHook(useStoreRegion, { wrapper });
  act(() => result.current.selectRegion("US"));
  await act(async () => resolve({ region: "EU", currency: "EUR" }));
  expect(result.current.selected).toEqual({ region: "US", currency: "USD" });
  expect(JSON.parse(localStorage.getItem(STORE_REGION_KEY)!)).toEqual({ region: "US", currency: "USD" });
});
it("restores a saved region and lets the visitor return to automatic detection", async () => {
  localStorage.setItem(STORE_REGION_KEY, JSON.stringify({ region: "UK", currency: "GBP" }));
  fetchContext.mockResolvedValue({ region: "US", currency: "USD" });
  const { result } = renderHook(useStoreRegion, { wrapper });
  await waitFor(() => expect(result.current.detecting).toBe(false));
  expect(result.current.selected.region).toBe("UK");
  act(() => result.current.useLocation());
  expect(result.current.selected.region).toBe("US");
  expect(localStorage.getItem(STORE_REGION_KEY)).toBeNull();
});
it("still allows selection when local storage is blocked", async () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
  fetchContext.mockResolvedValue({ region: "UK", currency: "GBP" });
  const { result } = renderHook(useStoreRegion, { wrapper });
  await waitFor(() => expect(result.current.detecting).toBe(false));
  act(() => result.current.selectRegion("EU"));
  expect(result.current.selected.region).toBe("EU");
});
it("falls back to labelled USD when an international rate request fails", async () => {
  fetchContext.mockImplementation(async context => {
    if (context === "region") return { region: "INTL", currency: "CAD" };
    throw new Error("offline");
  });
  const { result } = renderHook(useStoreRegion, { wrapper });
  await waitFor(() => expect(result.current.wantsEstimate && !result.current.loadingRates).toBe(true));
  expect(result.current.selected).toEqual({ region: "INTL", currency: "CAD" });
  expect(result.current.effective).toEqual({ region: "INTL", currency: "USD" });
});
