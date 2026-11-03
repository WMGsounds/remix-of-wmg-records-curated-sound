import { regionForCountry } from "../../src/lib/storeRegion.js";
import { storeCountry } from "../../src/lib/itunes.js";

type Request = { query?: Record<string, unknown>; headers?: Record<string, string | string[] | undefined> };
type Response = { writeHead: (status: number, headers: Record<string, string>) => { end: (body: string) => void } };

/** Public country lookup, isolated from the shared catalogue cache. */
export async function handleStoreContext(req: Request, res: Response): Promise<boolean> {
  if (req.query?.context === "rates") {
    // Old browser tabs must not trigger exchange-rate or private CMS requests.
    res.writeHead(410, { "Content-Type": "application/json", "Cache-Control": "no-store" })
      .end(JSON.stringify({ error: "Exchange-rate estimates are no longer available." }));
    return true;
  }
  if (req.query?.context !== "region") return false;
  const country = req.headers?.["x-vercel-ip-country"];
  const preference = regionForCountry(typeof country === "string" ? country : undefined);
  res.writeHead(200, {
    "Content-Type": "application/json",
    "Cache-Control": "private, no-store",
    "Vercel-CDN-Cache-Control": "no-store",
    Vary: "X-Vercel-IP-Country",
  }).end(JSON.stringify({ ...preference, country: storeCountry(country) }));
  return true;
}
