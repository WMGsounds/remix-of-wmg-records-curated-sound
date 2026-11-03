export type StoreRegion = "UK" | "EU" | "US" | "INTL";
export type FixedCurrency = "GBP" | "EUR" | "USD";
export type StorePreference = { region: StoreRegion; currency: FixedCurrency };

// EU membership, not the euro area or geographic Europe (verified 2026-11-01).
export const EU_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
]);
export const REGIONS: { value: StoreRegion; label: string }[] = [
  { value: "UK", label: "United Kingdom · GBP (£)" },
  { value: "EU", label: "European Union · EUR (€)" },
  { value: "US", label: "United States · USD (US$)" },
  { value: "INTL", label: "International · USD (US$)" },
];
export function fixedCurrency(region: StoreRegion): FixedCurrency {
  return region === "UK" ? "GBP" : region === "EU" ? "EUR" : "USD";
}
export function regionForCountry(country?: string): StorePreference {
  const code = country?.trim().toUpperCase();
  if (code === "GB" || code === "UK") return { region: "UK", currency: "GBP" };
  if (code === "US") return { region: "US", currency: "USD" };
  if (code && EU_COUNTRIES.has(code)) return { region: "EU", currency: "EUR" };
  return { region: "INTL", currency: "USD" };
}
export function validPreference(value: unknown): value is StorePreference {
  if (!value || typeof value !== "object") return false;
  const p = value as StorePreference;
  return REGIONS.some(r => r.value === p.region) &&
    p.currency === fixedCurrency(p.region);
}
