/** Coalesce country requests and cache only successful public catalogue loads. */
export function catalogueCache<T>(load: () => Promise<T>, ttlMs = 300_000) {
  let cached: { value: T; expires: number } | undefined;
  let pending: Promise<T> | undefined;
  return () => {
    if (cached && cached.expires > Date.now()) return Promise.resolve(cached.value);
    if (!pending) {
      pending = load().then(value => {
        cached = { value, expires: Date.now() + ttlMs };
        return value;
      }).finally(() => { pending = undefined; });
    }
    return pending;
  };
}
