import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchStoreContext } from "@/lib/api";
import { validPreference, usableRate, fixedCurrency, type ExchangeRates, type StorePreference, type StoreRegion } from "@/lib/storeRegion";

export const STORE_REGION_KEY = "wmg-store-region-v1";
const DEFAULT: StorePreference = { region: "INTL", currency: "USD" };

export function useStoreRegion() {
  // Same initial state on the server and browser: no hydration mismatch.
  const [detected, setDetected] = useState<StorePreference>(DEFAULT);
  const [preference, setPreference] = useState<StorePreference | null>(null);
  const [detecting, setDetecting] = useState(true);
  const [detectedLocation, setDetectedLocation] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_REGION_KEY) ?? "null");
      if (validPreference(saved)) setPreference(saved);
    } catch { /* Storage may be disabled or malformed; the selector still works. */ }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    let active = true;
    fetchStoreContext("region", controller.signal).then(value => {
      if (active && validPreference(value)) { setDetected(value); setDetectedLocation(true); }
    }).catch(() => {}).finally(() => {
      clearTimeout(timer);
      if (active) setDetecting(false);
    });
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, []);
  const selected = preference ?? detected;
  const wantsEstimate = selected.region === "INTL" && selected.currency !== "USD";
  const rates = useQuery({
    queryKey: ["store-exchange-rates"],
    queryFn: async () => {
      const result = await fetchStoreContext("rates", AbortSignal.timeout(6000)) as { rates?: ExchangeRates };
      return result.rates ?? {};
    },
    enabled: wantsEstimate, staleTime: 3600000, retry: false,
  });
  const candidate = rates.data?.[selected.currency];
  const rate = usableRate(candidate) ? candidate : undefined;
  // A failed/stale rate must never masquerade as a local-currency price.
  const effective = wantsEstimate && !rate ? { ...selected, currency: "USD" } : selected;

  function save(value: StorePreference | null) {
    setPreference(value);
    try {
      if (value) localStorage.setItem(STORE_REGION_KEY, JSON.stringify(value));
      else localStorage.removeItem(STORE_REGION_KEY);
    } catch { /* In-memory choice remains usable. */ }
  }
  function selectRegion(region: StoreRegion) {
    save({ region, currency: region === "INTL" ? (detected.region === "INTL" ? detected.currency : "USD") : fixedCurrency(region) });
  }
  function selectCurrency(currency: string) {
    const next: StorePreference = { region: "INTL", currency };
    if (validPreference(next)) save(next);
  }
  return {
    selected, effective, rate, selectRegion, selectCurrency,
    automatic: preference === null, useLocation: () => save(null),
    detecting, detectedLocation, wantsEstimate, loadingRates: wantsEstimate && rates.isPending,
  };
}
