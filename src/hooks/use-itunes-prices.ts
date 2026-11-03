import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { storeCountry, freshItunesPrices, type ItunesPrices } from "@/lib/itunes";
import { fetchItunesPrices } from "@/lib/api";

export const ITUNES_COUNTRY_KEY = "wmg-itunes-country-v1";
export function useItunesPrices(detectedCountry: string | null, enabled: boolean) {
  const [saved, setSaved] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    try { setSaved(storeCountry(localStorage.getItem(ITUNES_COUNTRY_KEY))); } catch { /* Optional storage. */ }
    setReady(true);
  }, []);
  const country = saved ?? detectedCountry;
  const query = useQuery<ItunesPrices>({
    queryKey: ["itunes-prices", country],
    queryFn: ({ signal }) => fetchItunesPrices(country!, signal),
    enabled: ready && enabled && !!country,
    staleTime: 5 * 60 * 1000, retry: false,
    refetchInterval: 5 * 60 * 1000,
  });
  const { refetch } = query;
  useEffect(() => {
    setNow(Date.now());
    if (!freshItunesPrices(query.data, country) || !enabled) return;
    // Hide the old quote exactly when it expires, including an open/sleeping tab.
    const timer = setTimeout(() => { setNow(Date.now()); void refetch(); },
      Math.max(1000, Date.parse(query.data.expiresAt) - Date.now() + 25));
    const onFocus = () => setNow(Date.now());
    window.addEventListener("focus", onFocus);
    return () => { clearTimeout(timer); window.removeEventListener("focus", onFocus); };
  }, [query.data, country, enabled, refetch]);
  function choose(value: string | null) {
    const valid = storeCountry(value);
    setSaved(valid);
    try {
      if (valid) localStorage.setItem(ITUNES_COUNTRY_KEY, valid);
      else localStorage.removeItem(ITUNES_COUNTRY_KEY);
    } catch { /* In-memory selector remains usable. */ }
  }
  return {
    country, choose, automatic: saved === null,
    data: freshItunesPrices(query.data, country, Math.max(now, Date.now())) ? query.data : undefined,
    loading: !!country && query.isPending, failed: query.isError,
  };
}
