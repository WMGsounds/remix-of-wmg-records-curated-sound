import type { StoreFormat, StoreItem } from "./types";
import { fixedCurrency, usableRate, type ExchangeRate, type StorePreference } from "./storeRegion";

/** Reject mismatched/ambiguous currencies instead of silently relabelling prices. */
export function priceAmount(raw: string | undefined, currency: string): number | null {
  if (!raw) return null;
  const prefix = currency === "GBP" ? "(?:£|GBP)" : currency === "EUR" ? "(?:€|EUR)" : "(?:US\\$|USD|\\$)";
  const match = raw.trim().match(new RegExp(`^${prefix}\\s*(\\d+(?:\\.\\d{1,2})?)$`, "i"));
  return match ? Number(match[1]) : null;
}
export function money(amount: number, currency: string): string {
  if (currency === "GBP") return `£${amount.toFixed(2)}`;
  if (currency === "EUR") return `€${amount.toFixed(2)}`;
  if (currency === "USD") return `US$${amount.toFixed(2)}`;
  return new Intl.NumberFormat("en", { style: "currency", currency, currencyDisplay: "code" }).format(amount);
}
export function localizeStoreItem(item: StoreItem, preference: StorePreference, rate?: ExchangeRate): StoreItem {
  const estimated = preference.region === "INTL" && preference.currency !== "USD";
  const currency = estimated ? preference.currency : fixedCurrency(preference.region);
  const sourceCurrency = estimated ? "USD" : currency;
  const source = sourceCurrency === "GBP" ? item.prices : item.regionalPrices?.[sourceCurrency];
  const prices: Partial<Record<StoreFormat, string>> = {};
  const amounts: number[] = [];
  for (const format of item.formats) {
    const amount = priceAmount(source?.[format], sourceCurrency);
    if (amount === null || (estimated && !usableRate(rate))) continue;
    const displayed = amount * (estimated ? rate!.rate : 1);
    prices[format] = `${estimated ? "≈ " : ""}${money(displayed, currency)}`;
    amounts.push(displayed);
  }
  return {
    ...item,
    prices,
    priceSummary: item.displayPriceSummary && amounts.length
      ? `From ${estimated ? "≈ " : ""}${money(Math.min(...amounts), currency)}` : null,
  };
}
