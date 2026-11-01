import { INTERNATIONAL_CURRENCIES, regionForCountry, usableRate, type ExchangeRates } from "../../src/lib/storeRegion.js";

export function parseExchangeRates(rows: unknown, now = Date.now()): ExchangeRates {
  if (!Array.isArray(rows)) return {};
  const rates: ExchangeRates = {};
  for (const row of rows) {
    const quote = row?.quote;
    if (row?.base === "USD" && INTERNATIONAL_CURRENCIES.includes(quote) && usableRate(row, now)) {
      rates[quote] = { rate: row.rate, date: row.date };
    }
  }
  return rates;
}

type Request = { query?: Record<string, unknown>; headers?: Record<string, string | string[] | undefined> };
type Response = { writeHead: (status: number, headers: Record<string, string>) => { end: (body: string) => void } };

/** Reuse the store function: no additional Vercel function or private CMS access. */
export async function handleStoreContext(req: Request, res: Response): Promise<boolean> {
  if (req.query?.context === "region") {
    const country = req.headers?.["x-vercel-ip-country"];
    const preference = regionForCountry(typeof country === "string" ? country : undefined);
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Cache-Control": "private, no-store",
      "Vercel-CDN-Cache-Control": "no-store",
      Vary: "X-Vercel-IP-Country",
    }).end(JSON.stringify(preference));
    return true;
  }
  if (req.query?.context !== "rates") return false;
  try {
    // Only public currency codes are sent upstream, never visitor location or IP.
    const response = await fetch("https://api.frankfurter.dev/v2/rates?base=USD", { signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error("Exchange rates unavailable");
    const rates = parseExchangeRates(await response.json());
    if (!Object.keys(rates).length) throw new Error("No current exchange rates");
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600, s-maxage=3600" })
      .end(JSON.stringify({ base: "USD", source: "Frankfurter", rates }));
  } catch {
    res.writeHead(503, { "Content-Type": "application/json", "Cache-Control": "no-store" })
      .end(JSON.stringify({ base: "USD", rates: {} }));
  }
  return true;
}
