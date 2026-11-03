// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { loadAll } from "../../api/notion/_normalize";
import { catalogueCache } from "../../api/notion/_catalogueCache";

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
