import { useState } from "react";
import { Check, Globe2 } from "lucide-react";
import { countryName } from "@/lib/itunes";
import { SHIPPING_COUNTRIES, SHIPPING_COUNTRY_OPTIONS } from "@/lib/shippingCountries";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import type { useStoreRegion } from "@/hooks/use-store-region";

const PINNED = ["GB", "US"];
const OTHER_COUNTRIES = SHIPPING_COUNTRY_OPTIONS.filter(country => !PINNED.includes(country.code));

export function StoreRegionSelector({ storeRegion: r }: { storeRegion: ReturnType<typeof useStoreRegion> }) {
  const [open, setOpen] = useState(false);
  function choose(country: string | null) {
    r.chooseCountry(country);
    setOpen(false);
  }
  function option(code: string, name: string) {
    return <CommandItem key={code} value={`${name} ${code}`} keywords={code === "GB" ? ["UK", "Britain"] : code === "US" ? ["USA", "America"] : []}
      onSelect={() => choose(code)} className="min-h-11 cursor-pointer px-3 text-ivory data-[selected=true]:bg-gold/15 data-[selected=true]:text-ivory">
      <span className="flex-1">{name}</span>
      {r.country === code && <><Check aria-hidden="true" className="h-4 w-4 text-gold" /><span className="sr-only">Current country</span></>}
    </CommandItem>;
  }
  return <div className="mb-9"><div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
    <Globe2 aria-hidden="true" className="h-4 w-4 shrink-0 text-ivory/50" />
    <span className="text-ivory/70" aria-live="polite">
      {r.country ? countryName(r.country) : r.detecting ? "Finding your region…" : "International"}
    </span>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="min-h-11 text-gold underline decoration-gold/40 underline-offset-4 transition-colors hover:text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">
          Change region
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} collisionPadding={16} aria-label="Change region"
        className="flex max-h-[var(--radix-popover-content-available-height)] w-80 max-w-[calc(100vw-2rem)] flex-col overflow-y-auto border-gold/25 bg-ink p-0 text-ivory shadow-2xl [color-scheme:dark]">
        <div className="shrink-0 px-4 pb-3 pt-4">
          <p className="font-medium">Choose your country</p>
          <p className="mt-1 text-xs leading-relaxed text-ivory/55">Sets prices and the iTunes store.</p>
        </div>
        <Command className="h-auto min-h-0 flex-1 rounded-none bg-ink text-ivory">
          <CommandInput placeholder="Search countries…" aria-label="Search countries" />
          <CommandList className="min-h-0 max-h-[min(340px,45dvh)]" aria-label="Countries">
            <CommandEmpty>No delivery countries found.</CommandEmpty>
            <CommandGroup heading="Quick choices" className="text-ivory">
              {PINNED.map(code => option(code, countryName(code)))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Delivery countries" className="text-ivory">
              {OTHER_COUNTRIES.map(country => option(country.code, country.name))}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="shrink-0 border-t border-ivory/10 px-4 py-3 text-xs leading-relaxed text-ivory/55">
          {r.automatic ? <p>{r.detecting ? "Detecting your country automatically…" : r.country ? "Your country was detected automatically." : "Choose a country to see local prices."}</p>
            : <button type="button" onClick={() => choose(null)} className="min-h-8 text-gold underline underline-offset-4 focus-visible:outline focus-visible:outline-gold">Use my location automatically</button>}
          <p className="mt-2">Check your shipping country on the purchase page; delivery and any additional charges are confirmed at checkout.</p>
        </div>
      </PopoverContent>
    </Popover>
    </div>
    {r.country && !SHIPPING_COUNTRIES.has(r.country) && <p role="status" className="mt-1 text-xs text-ivory/60">
      Vinyl and CD delivery is not currently listed for {countryName(r.country)}. Choose a supported delivery country above.
    </p>}
  </div>;
}
