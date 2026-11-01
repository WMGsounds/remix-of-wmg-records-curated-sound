export type StoreRegion = "UK" | "EU" | "US" | "INTL";
export type FixedCurrency = "GBP" | "EUR" | "USD";
export type StorePreference = { region: StoreRegion; currency: string };
export type ExchangeRate = { rate: number; date: string };
export type ExchangeRates = Record<string, ExchangeRate>;

// EU membership, not the euro area or geographic Europe (verified 2026-11-01).
export const EU_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
]);
const COUNTRY_CURRENCY: Record<string, string> = {
  AE: "AED", AL: "ALL", AR: "ARS", AU: "AUD", BA: "BAM", BD: "BDT", BH: "BHD",
  BO: "BOB", BR: "BRL", BS: "BSD", CA: "CAD", CH: "CHF", CL: "CLP", CN: "CNY",
  CO: "COP", CR: "CRC", DO: "DOP", DZ: "DZD", EG: "EGP", ET: "ETB", GE: "GEL",
  GH: "GHS", GT: "GTQ", HK: "HKD", ID: "IDR", IL: "ILS", IN: "INR", IS: "ISK",
  JM: "JMD", JO: "JOD", JP: "JPY", KE: "KES", KR: "KRW", KW: "KWD", KZ: "KZT",
  LI: "CHF", LK: "LKR", MA: "MAD", MD: "MDL", MK: "MKD", MU: "MUR", MX: "MXN",
  MY: "MYR", NG: "NGN", NI: "NIO", NO: "NOK", NP: "NPR", NZ: "NZD", OM: "OMR",
  PE: "PEN", PH: "PHP", PK: "PKR", QA: "QAR", RS: "RSD", SA: "SAR", SG: "SGD",
  TH: "THB", TN: "TND", TR: "TRY", TW: "TWD", TZ: "TZS", UA: "UAH", UG: "UGX",
  UY: "UYU", VN: "VND", ZA: "ZAR", ZM: "ZMW",
  AD: "EUR", MC: "EUR", ME: "EUR", SM: "EUR", VA: "EUR", XK: "EUR",
  GG: "GBP", GI: "GBP", IM: "GBP", JE: "GBP",
};
export const INTERNATIONAL_CURRENCIES = [...new Set(["USD", ...Object.values(COUNTRY_CURRENCY)])].sort();
export const REGIONS: { value: StoreRegion; label: string }[] = [
  { value: "UK", label: "United Kingdom · GBP (£)" },
  { value: "EU", label: "European Union · EUR (€)" },
  { value: "US", label: "United States · USD (US$)" },
  { value: "INTL", label: "International" },
];
export function fixedCurrency(region: StoreRegion): FixedCurrency {
  return region === "UK" ? "GBP" : region === "EU" ? "EUR" : "USD";
}
export function regionForCountry(country?: string): StorePreference {
  const code = country?.trim().toUpperCase();
  if (code === "GB" || code === "UK") return { region: "UK", currency: "GBP" };
  if (code === "US") return { region: "US", currency: "USD" };
  if (code && EU_COUNTRIES.has(code)) return { region: "EU", currency: "EUR" };
  return { region: "INTL", currency: COUNTRY_CURRENCY[code ?? ""] ?? "USD" };
}
export function validPreference(value: unknown): value is StorePreference {
  if (!value || typeof value !== "object") return false;
  const p = value as StorePreference;
  return REGIONS.some(r => r.value === p.region) &&
    (p.region === "INTL" ? INTERNATIONAL_CURRENCIES.includes(p.currency) : p.currency === fixedCurrency(p.region));
}
export function usableRate(value: ExchangeRate | undefined, now = Date.now()): value is ExchangeRate {
  if (!value || !Number.isFinite(value.rate) || value.rate <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(value.date)) return false;
  const age = now - Date.parse(value.date + "T00:00:00Z");
  return age >= -86400000 && age <= 7 * 86400000;
}
