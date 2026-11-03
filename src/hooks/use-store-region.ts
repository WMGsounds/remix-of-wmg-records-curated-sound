import { useEffect, useState } from "react";
import { fetchStoreContext } from "@/lib/api";
import { storeCountry } from "@/lib/itunes";
import { validPreference, fixedCurrency, type StorePreference, type StoreRegion } from "@/lib/storeRegion";

export const STORE_REGION_KEY = "wmg-store-region-v1";
const DEFAULT: StorePreference = { region: "INTL", currency: "USD" };

export function useStoreRegion() {
  // Same initial state on the server and browser: no hydration mismatch.
  const [detected, setDetected] = useState<StorePreference>(DEFAULT);
  const [preference, setPreference] = useState<StorePreference | null>(null);
  const [detecting, setDetecting] = useState(true);
  const [detectedLocation, setDetectedLocation] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  useEffect(() => {
    try {
      let saved = JSON.parse(localStorage.getItem(STORE_REGION_KEY) ?? "null");
      // Migrate saved international display currencies to the USD bucket.
      if (saved?.region === "INTL" && typeof saved.currency === "string") {
        saved = { region: "INTL", currency: "USD" };
      }
      if (validPreference(saved)) setPreference(saved);
    } catch { /* Storage may be disabled or malformed; the selector still works. */ }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    let active = true;
    fetchStoreContext("region", controller.signal).then(value => {
      if (active && validPreference(value)) {
        setDetected(value); setDetectedLocation(true);
        setDetectedCountry(storeCountry((value as { country?: unknown }).country));
      }
    }).catch(() => {}).finally(() => {
      clearTimeout(timer);
      if (active) setDetecting(false);
    });
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, []);
  const selected = preference ?? detected;
  function save(value: StorePreference | null) {
    setPreference(value);
    try {
      if (value) localStorage.setItem(STORE_REGION_KEY, JSON.stringify(value));
      else localStorage.removeItem(STORE_REGION_KEY);
    } catch { /* In-memory choice remains usable. */ }
  }
  function selectRegion(region: StoreRegion) {
    save({ region, currency: fixedCurrency(region) });
  }
  return {
    selected, selectRegion,
    automatic: preference === null, useLocation: () => save(null),
    detecting, detectedLocation, detectedCountry,
  };
}
