import { COUNTRY_OPTIONS, countryName } from "@/lib/itunes";
import type { useItunesPrices } from "@/hooks/use-itunes-prices";

export function ItunesCountrySelector({ itunes }: { itunes: ReturnType<typeof useItunesPrices> }) {
  return <section aria-label="iTunes store country" className="mb-12 border-b border-gold/25 pb-6">
    <div className="flex flex-wrap items-end gap-5">
      <div className="w-full sm:w-auto">
        <label htmlFor="itunes-country" className="mb-2 block text-xs uppercase tracking-[0.18em] text-gold-soft">iTunes store country</label>
        <select id="itunes-country" value={itunes.country ?? ""} onChange={event => itunes.choose(event.target.value)}
          className="w-full min-w-0 border border-ivory/25 bg-ink px-3 py-3 text-sm text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold sm:w-auto">
          <option value="" disabled>Choose your Apple store country</option>
          {COUNTRY_OPTIONS.map(country => <option key={country.code} value={country.code}>{country.name}</option>)}
        </select>
      </div>
      {!itunes.automatic && <button type="button" onClick={() => itunes.choose(null)} className="py-3 text-sm text-gold underline underline-offset-4 focus-visible:outline focus-visible:outline-gold">Use my location for iTunes</button>}
    </div>
    <div role="status" aria-live="polite" className="mt-3 space-y-2 text-sm leading-relaxed text-ivory/65">
      <p>Choose the country used by your Apple account. iTunes prices refresh daily in that store’s currency.</p>
      <p>This choice does not change vinyl or CD prices.</p>
      {itunes.loading ? <p>Checking iTunes prices…</p> : itunes.failed ? <p>iTunes prices are temporarily unavailable. Check the iTunes store for the latest price.</p> : null}
      {itunes.data ? <p>iTunes store: {countryName(itunes.data.country)}. Last checked {new Date(itunes.data.checkedAt).toLocaleDateString("en-GB", { timeZone: "UTC" })}.</p> : null}
    </div>
  </section>;
}
