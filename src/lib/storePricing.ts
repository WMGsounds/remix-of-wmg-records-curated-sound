import type { StoreFormat, StoreItem } from "./types";
import { fixedCurrency, type StorePreference } from "./storeRegion";

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
export function localizeStoreItem(item: StoreItem, preference: StorePreference): StoreItem {
  const currency = fixedCurrency(preference.region);
  const source = currency === "GBP" ? item.prices : item.regionalPrices?.[currency];
  const prices: Partial<Record<StoreFormat, string>> = {};
  const amounts: number[] = [];
  for (const format of item.formats) {
    if (format === "iTunes") continue;
    const amount = priceAmount(source?.[format], currency);
    if (amount === null) continue;
    prices[format] = money(amount, currency);
    amounts.push(amount);
  }
  return {
    ...item,
    prices,
    priceSummary: item.displayPriceSummary && amounts.length
      ? `From ${money(Math.min(...amounts), currency)}` : null,
  };
}
