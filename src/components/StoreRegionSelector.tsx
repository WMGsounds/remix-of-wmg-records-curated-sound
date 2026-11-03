import { REGIONS, type StoreRegion } from "@/lib/storeRegion";
import type { useStoreRegion } from "@/hooks/use-store-region";

type Props = { storeRegion: ReturnType<typeof useStoreRegion> };
const selectClass = "w-full min-w-0 border border-ivory/25 bg-ink px-3 py-3 text-sm text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold sm:w-auto";

export function StoreRegionSelector({ storeRegion: r }: Props) {
  const findingRegion = r.automatic && r.detecting;
  return (
    <section aria-label="Store region and currency" className="mb-12 border-y border-gold/25 py-6">
      <div className="flex flex-wrap items-end gap-5">
        <div className="w-full sm:w-auto">
          <label htmlFor="store-region" className="mb-2 block text-xs uppercase tracking-[0.18em] text-gold-soft">Vinyl &amp; CD region</label>
          <select id="store-region" value={findingRegion ? "" : r.selected.region} onChange={e => r.selectRegion(e.target.value as StoreRegion)} className={selectClass}>
            {findingRegion && <option value="" disabled>Detecting your region…</option>}
            {REGIONS.map(region => <option key={region.value} value={region.value}>{region.label}</option>)}
          </select>
        </div>
        {!r.automatic && <button type="button" onClick={r.useLocation} className="py-3 text-sm text-gold underline underline-offset-4 hover:text-ivory focus-visible:outline focus-visible:outline-gold">Use my location</button>}
      </div>
      <div role="status" aria-live="polite" className="mt-3 space-y-2 text-sm leading-relaxed text-ivory/65">
        {r.automatic && r.detecting ? <p>Finding your region… You can also choose it above.</p> : null}
        {r.automatic && !r.detecting && !r.detectedLocation ? <p>We couldn’t detect your region. Choose it above; prices currently show in US dollars.</p> : null}
        <p>Vinyl and CD prices shown in {r.selected.currency === "GBP" ? "pounds sterling" : r.selected.currency === "EUR" ? "euros" : "US dollars"}.</p>
        <p>Check your shipping country on the purchase page; delivery and any additional charges are confirmed at checkout.</p>
      </div>
    </section>
  );
}
