// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { loadAll } from "../../api/notion/_normalize";
import { catalogueCache } from "../../api/notion/_catalogueCache";
import { getItunesPrices } from "../../api/notion/_itunes";
import storeHandler from "../../api/notion/store";

vi.mock("../../api/notion/_normalize", { spy: true });
vi.mock("../../api/notion/_itunes", () => ({ getItunesPrices: vi.fn() }));
vi.mock("../../api/notion/_client", () => ({
  notion: {},
  DBS: { storeItems: "store", releases: "releases", artists: "artists", tracks: "tracks", releaseTracks: "pivot" },
  requireEnv: vi.fn(),
  CACHE_HEADERS: {},
  logApiError: vi.fn(),
  logApiSuccess: vi.fn(),
}));

afterEach(() => vi.useRealTimers());
it("retries database resolution after a rate limit instead of caching its rejection", async () => {
  const notion = {
    databases: { retrieve: vi.fn().mockRejectedValueOnce({ status: 429 }).mockResolvedValue({ data_sources: [{ id: "recovered-source" }] }) },
    dataSources: { query: vi.fn().mockResolvedValue({ results: [{ id: "real-release" }], has_more: false }) },
  };
  await expect(loadAll(notion, "retry-database")).rejects.toEqual({ status: 429 });
  await expect(loadAll(notion, "retry-database")).resolves.toEqual([{ id: "real-release" }]);
  expect(notion.databases.retrieve).toHaveBeenCalledTimes(2);
});
it("coalesces simultaneous country catalogue loads, caches successes and refreshes after expiry", async () => {
  vi.useFakeTimers();
  const load = vi.fn().mockResolvedValue(["published-release"]);
  const get = catalogueCache(load, 300_000);
  await Promise.all([get(), get(), get()]);
  expect(load).toHaveBeenCalledTimes(1);
  await get();
  expect(load).toHaveBeenCalledTimes(1);
  vi.advanceTimersByTime(300_001);
  await get();
  expect(load).toHaveBeenCalledTimes(2);
});
it("does not retain failures or return expired catalogue data after a failed refresh", async () => {
  vi.useFakeTimers();
  const load = vi.fn().mockRejectedValueOnce(new Error("429"))
    .mockResolvedValueOnce(["real-release"]).mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce(["updated-release"]);
  const get = catalogueCache(load, 100);
  await expect(get()).rejects.toThrow("429");
  await expect(get()).resolves.toEqual(["real-release"]);
  vi.advanceTimersByTime(101);
  await expect(get()).rejects.toThrow("offline");
  await expect(get()).resolves.toEqual(["updated-release"]);
});

it("quotes only public iTunes listings using Store and Releases, even when full catalogue details are unavailable", async () => {
  const loadStoreRows = vi.mocked(loadAll);
  loadStoreRows.mockClear();
  const props = {
    Published: { type: "checkbox", checkbox: true },
    Availability: { select: { name: "Available Now" } },
    Format: { multi_select: [{ name: "iTunes" }, { name: "CD" }] },
    Release: { relation: [{ id: "r1" }] },
  };
  const appleMusicUrl = "https://music.apple.com/gb/album/record/123?i=456";
  const fixture = async (_notion: unknown, db: string) => {
    if (db === "store") return [
      { id: "public", properties: props },
      { id: "hidden", properties: { ...props, Availability: { select: { name: "Hidden" } } } },
      { id: "draft", properties: { ...props, Published: { type: "checkbox", checkbox: false } } },
      { id: "physical", properties: { ...props, Format: { multi_select: [{ name: "CD" }] } } },
    ];
    if (db === "releases") return [{ id: "r1", properties: { "Apple Music URL": { url: appleMusicUrl } } }];
    throw new Error("Detail database unavailable");
  };
  loadStoreRows.mockImplementationOnce(fixture).mockImplementationOnce(fixture).mockImplementationOnce(fixture);
  const expiresAt = new Date(Date.now() + 86400000).toISOString();
  vi.mocked(getItunesPrices).mockResolvedValue({ country: "PL", checkedAt: new Date().toISOString(), expiresAt, offers: {} });

  const writeHead = vi.fn().mockReturnValue({ end: vi.fn() });
  const response = { writeHead, status: vi.fn() };
  await storeHandler({ query: { context: "itunes", country: "PL" } }, response);
  expect(writeHead).toHaveBeenCalledWith(200, expect.any(Object));
  expect(loadStoreRows.mock.calls.map(([, db]) => db)).toEqual(["store", "releases"]);
  expect(getItunesPrices).toHaveBeenCalledWith([{ id: "public", formats: ["iTunes", "CD"], appleMusicUrl }], "PL");

  await storeHandler({ query: {} }, response);
  expect(writeHead).toHaveBeenLastCalledWith(503, expect.any(Object));
  expect(loadStoreRows.mock.calls.map(([, db]) => db)).toEqual(["store", "releases", "artists"]);
});
