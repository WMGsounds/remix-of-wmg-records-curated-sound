import { act, renderHook, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useStoreRegion, STORE_COUNTRY_KEY } from "../hooks/use-store-region";
import { fetchStoreContext } from "../lib/api";
vi.mock("../lib/api", () => ({ fetchStoreContext: vi.fn() }));
const fetchContext = vi.mocked(fetchStoreContext);
beforeEach(() => { localStorage.clear(); fetchContext.mockReset(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it("never overwrites a manual US country when slower automatic detection finishes", async () => {
  let resolve!: (value: unknown) => void;
  fetchContext.mockReturnValue(new Promise(r => { resolve = r; }));
  const { result } = renderHook(useStoreRegion);
  act(() => result.current.chooseCountry("US"));
  await act(async () => resolve({ country: "PL", region: "EU", currency: "EUR" }));
  expect(result.current.country).toBe("US");
  expect(result.current.selected).toEqual({ region: "US", currency: "USD" });
  expect(localStorage.getItem(STORE_COUNTRY_KEY)).toBe("US");
});
it("restores one saved country and returns both formats to the detected country", async () => {
  localStorage.setItem(STORE_COUNTRY_KEY, "GB");
  fetchContext.mockResolvedValue({ country: "PL" });
  const { result } = renderHook(useStoreRegion);
  await waitFor(() => expect(result.current.detecting).toBe(false));
  expect(result.current.selected.region).toBe("UK");
  act(() => result.current.chooseCountry(null));
  expect(result.current.country).toBe("PL");
  expect(result.current.selected.currency).toBe("EUR");
  expect(result.current.automatic).toBe(true);
  expect(localStorage.getItem(STORE_COUNTRY_KEY)).toBeNull();
});
it("still allows selection when local storage is blocked", async () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
  fetchContext.mockResolvedValue({ country: "GB" });
  const { result } = renderHook(useStoreRegion);
  await waitFor(() => expect(result.current.detecting).toBe(false));
  act(() => result.current.chooseCountry("CA"));
  expect(result.current.country).toBe("CA");
  expect(result.current.selected).toEqual({ region: "INTL", currency: "USD" });
});
it("migrates an exact legacy country ahead of an aggregate preference and removes both old keys", async () => {
  localStorage.setItem("wmg-itunes-country-v1", "JP");
  localStorage.setItem("wmg-store-region-v1", JSON.stringify({ region: "UK", currency: "GBP" }));
  fetchContext.mockResolvedValue({ country: "US" });
  const { result } = renderHook(useStoreRegion);
  await waitFor(() => expect(result.current.detecting).toBe(false));
  expect(result.current.country).toBe("JP");
  expect(localStorage.getItem(STORE_COUNTRY_KEY)).toBe("JP");
  expect(localStorage.getItem("wmg-itunes-country-v1")).toBeNull();
  expect(localStorage.getItem("wmg-store-region-v1")).toBeNull();
  act(() => result.current.chooseCountry(null));
  expect(result.current.country).toBe("US");
});
it("does not invent a country from an aggregate legacy region or unavailable location", async () => {
  localStorage.setItem("wmg-store-region-v1", JSON.stringify({ region: "EU", currency: "EUR" }));
  fetchContext.mockRejectedValue(new Error("offline"));
  const { result } = renderHook(useStoreRegion);
  await waitFor(() => expect(result.current.detecting).toBe(false));
  expect(result.current.country).toBeNull();
  expect(result.current.selected).toEqual({ region: "INTL", currency: "USD" });
  act(() => result.current.chooseCountry("invalid"));
  expect(result.current.country).toBeNull();
});
