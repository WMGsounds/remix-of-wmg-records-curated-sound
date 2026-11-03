import type { StoreItem } from "./types";

// ISO country choices, not a claim that iTunes sells music in every country.
export const STORE_COUNTRIES = ("AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW").split(" ");
const countries = new Set(STORE_COUNTRIES);
export function storeCountry(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.toUpperCase();
  return countries.has(code) ? code : null;
}
const countryNames = new Intl.DisplayNames(["en"], { type: "region" });
export const countryName = (code: string) => countryNames.of(code) ?? code;
export const COUNTRY_OPTIONS = STORE_COUNTRIES.map(code => ({ code, name: countryName(code) }))
  .sort((a, b) => a.name.localeCompare(b.name, "en"));

export type ItunesOffer = { amount: number; currency: string; url: string };
export type ItunesPrices = { country: string; checkedAt: string; expiresAt: string; offers: Record<string, ItunesOffer> };
export const ITUNES_DAY_MS = 24 * 60 * 60 * 1000;

export function appleAlbumId(value?: string | null): string | null {
  try {
    const url = new URL(value ?? "");
    if (url.protocol !== "https:" || !["music.apple.com", "itunes.apple.com"].includes(url.hostname)) return null;
    const track = url.searchParams.get("i");
    if (track && /^\d+$/.test(track)) return track;
    return url.pathname.match(/\/(?:album|song)\/(?:[^/]+\/)?(?:id)?(\d+)\/?$/)?.[1] ?? null;
  } catch { return null; }
}
export function applePurchaseUrl(value: string | null | undefined, country: string | null): string | undefined {
  if (!appleAlbumId(value) || !storeCountry(country)) return undefined;
  const url = new URL(value!);
  url.pathname = url.pathname.replace(/^\/[a-z]{2}\//i, `/${country!.toLowerCase()}/`);
  url.searchParams.set("app", "itunes");
  return url.href;
}
export function freshItunesPrices(value: ItunesPrices | undefined, country: string | null, now = Date.now()): value is ItunesPrices {
  if (!value || value.country !== country || !value.offers) return false;
  const checked = Date.parse(value.checkedAt), expires = Date.parse(value.expiresAt);
  return Number.isFinite(checked) && Number.isFinite(expires) && checked <= now + 60000 &&
    expires > now && expires > checked && expires - checked <= ITUNES_DAY_MS;
}
export function applyItunesPrices(item: StoreItem, data?: ItunesPrices, country: string | null = null): StoreItem {
  // The Notion iTunes amount must never survive as a stale or wrong-country quote.
  const prices = { ...item.prices };
  delete prices.iTunes;
  const offer = data?.offers[item.id];
  if (item.formats.includes("iTunes") && offer) {
    const symbol = { GBP: "£", EUR: "€", USD: "US$" }[offer.currency];
    prices.iTunes = symbol ? `${symbol}${offer.amount.toFixed(2)}` : new Intl.NumberFormat("en", { style: "currency", currency: offer.currency }).format(offer.amount);
  }
  return { ...item, prices, itunesOffer: offer, itunesCountry: country, itunesPurchaseLink: offer?.url ?? applePurchaseUrl(item.appleMusicUrl, country) };
}
