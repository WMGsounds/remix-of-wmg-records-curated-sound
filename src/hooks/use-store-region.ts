import { useEffect, useMemo, useState } from "react";
import { fetchStoreContext } from "@/lib/api";
import { storeCountry } from "@/lib/itunes";
import { regionForCountry } from "@/lib/storeRegion";

export const STORE_COUNTRY_KEY = "wmg-store-country-v1";
const LEGACY_REGION_KEY = "wmg-store-region-v1";
const LEGACY_ITUNES_KEY = "wmg-itunes-country-v1";

export function useStoreRegion() {
  // Identical initial state on the server and browser prevents hydration mismatch.
  const [preference, setPreference] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(true);
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  useEffect(() => {
    try {
      let saved = storeCountry(localStorage.getItem(STORE_COUNTRY_KEY));
      if (!saved) {
        saved = storeCountry(localStorage.getItem(LEGACY_ITUNES_KEY));
        if (!saved) {
          try {
            const old = JSON.parse(localStorage.getItem(LEGACY_REGION_KEY) ?? "null");
            saved = old?.region === "UK" ? "GB" : old?.region === "US" ? "US" : null;
          } catch { /* An aggregate region cannot identify an individual country. */ }
        }
      }
      if (saved) {
        setPreference(saved);
        localStorage.setItem(STORE_COUNTRY_KEY, saved);
      }
      localStorage.removeItem(LEGACY_REGION_KEY);
      localStorage.removeItem(LEGACY_ITUNES_KEY);
    } catch { /* Storage is optional; in-memory selection still works. */ }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    let active = true;
    fetchStoreContext("region", controller.signal).then(value => {
      if (active) setDetectedCountry(storeCountry((value as { country?: unknown })?.country));
    }).catch(() => {}).finally(() => {
      clearTimeout(timer);
      if (active) setDetecting(false);
    });
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, []);
  const country = preference ?? detectedCountry;
  const selected = useMemo(() => regionForCountry(country), [country]);
  function chooseCountry(value: string | null) {
    const valid = storeCountry(value);
    if (value !== null && !valid) return;
    setPreference(valid);
    try {
      if (valid) localStorage.setItem(STORE_COUNTRY_KEY, valid);
      else localStorage.removeItem(STORE_COUNTRY_KEY);
      localStorage.removeItem(LEGACY_REGION_KEY);
      localStorage.removeItem(LEGACY_ITUNES_KEY);
    } catch { /* In-memory choice remains usable. */ }
  }
  return { country, selected, chooseCountry, automatic: preference === null, detecting };
}
