import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { freshItunesPrices, type ItunesPrices } from "@/lib/itunes";
import { fetchItunesPrices } from "@/lib/api";

export function useItunesPrices(country: string | null, enabled: boolean) {
  const [now, setNow] = useState(Date.now);
  const query = useQuery<ItunesPrices>({
    queryKey: ["itunes-prices", country],
    queryFn: ({ signal }) => fetchItunesPrices(country!, signal),
    enabled: enabled && !!country,
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
  return {
    country,
    data: freshItunesPrices(query.data, country, Math.max(now, Date.now())) ? query.data : undefined,
    loading: !!country && query.isPending, failed: query.isError,
  };
}
