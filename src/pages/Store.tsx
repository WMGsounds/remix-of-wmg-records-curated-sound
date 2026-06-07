import { useMemo, useState } from "react";
import { Seo } from "@/components/Seo";
import { breadcrumbSchema } from "@/lib/seo";
import { useStoreItems } from "@/lib/queries";
import { InlineSkeleton, PageError } from "@/components/UIStates";
import { StoreCard } from "@/components/StoreCard";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterField, SearchInput } from "@/components/FilterBar";
import { matchesSearch } from "@/lib/search";
import type { StoreItem, StoreFormat } from "@/lib/types";

const storeHeroUrl = "/store-hero.png";

const FORMAT_DISPLAY_ORDER: StoreFormat[] = ["Vinyl", "CD", "iTunes", "Digital", "Merch", "Other"];
const sortOptions = ["Latest", "Artist", "Title"] as const;

type SortOption = (typeof sortOptions)[number];

function sortItems(list: StoreItem[], sort: SortOption): StoreItem[] {
  const arr = [...list];
  switch (sort) {
    case "Latest":
      return arr.sort(
        (a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime(),
      );
    case "Title":
      return arr.sort((a, b) => a.title.localeCompare(b.title));
    case "Artist":
      return arr.sort(
        (a, b) =>
          (a.artist?.name ?? "").localeCompare(b.artist?.name ?? "") ||
          a.title.localeCompare(b.title),
      );
    default:
      return arr;
  }
}

const Store = () => {
  const { data: items = [], isLoading, isError } = useStoreItems();
  // formatTypeFilter encodes: "All" | "fmt:Vinyl" | "type:Album"
  const [formatTypeFilter, setFormatTypeFilter] = useState<string>("All");
  const [sort, setSort] = useState<SortOption>("Latest");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Build format filter options from the actually-present formats.
  const availableFormats = useMemo<StoreFormat[]>(() => {
    const present = new Set<StoreFormat>();
    items.forEach((i) => i.formats.forEach((f) => present.add(f)));
    return FORMAT_DISPLAY_ORDER.filter((f) => present.has(f));
  }, [items]);

  // Build type filter options from the actually-present product types (preserve first-seen order).
  const availableTypes = useMemo<string[]>(() => {
    const seen: string[] = [];
    for (const i of items) {
      const t = i.productType?.trim();
      if (t && !seen.includes(t)) seen.push(t);
    }
    return seen;
  }, [items]);

  // Featured is computed from items independent of filters/sort so it never disappears
  // or reshuffles when filters change.
  const featured = useMemo(
    () => items.filter((i) => i.featured && i.availability !== "Hidden"),
    [items],
  );

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (i.availability === "Hidden") return false;
      if (i.featured) return false;
      if (formatTypeFilter !== "All") {
        if (formatTypeFilter.startsWith("fmt:")) {
          const f = formatTypeFilter.slice(4) as StoreFormat;
          if (!i.formats.includes(f)) return false;
        } else if (formatTypeFilter.startsWith("type:")) {
          const t = formatTypeFilter.slice(5);
          if ((i.productType ?? "") !== t) return false;
        }
      }
      if (!matchesSearch(searchQuery, [
        i.title,
        i.artist?.name,
        i.release?.title,
        i.formats.join(" "),
      ])) return false;
      return true;
    });
  }, [items, formatTypeFilter, searchQuery]);

  const rest = useMemo(() => sortItems(filtered, sort), [filtered, sort]);

  const hasAnyVisible = featured.length + items.filter((i) => i.availability !== "Hidden" && !i.featured).length > 0;

  if (isError) return <PageError message="Couldn't load the store." />;

  return (
    <div className="bg-ink text-ivory pb-32">
      <Seo
        title="Store"
        description="Buy WMG releases on vinyl, CD and digital. Limited editions, bundles and signed copies from Wareham Music Group artists."
        canonicalPath="/store"
        jsonLd={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Store", path: "/store" },
        ])}
      />

      <section className="relative overflow-hidden bg-ink pt-40 pb-24 md:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_38%,hsl(var(--golden-brown)/0.38),transparent_34%),radial-gradient(circle_at_18%_78%,hsl(var(--gold)/0.16),transparent_28%)]" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,hsl(var(--ivory)/0.8)_1px,transparent_1px),linear-gradient(0deg,hsl(var(--ivory)/0.8)_1px,transparent_1px)] [background-size:3px_3px]" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_42%,hsl(var(--ink)/0.72)_100%)]" aria-hidden="true" />
        <div className="relative container-editorial grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow mb-6 text-gold-soft">The Store</p>
            <h1 className="display-serif text-6xl md:text-8xl lg:text-9xl mb-10">Store</h1>
            <p className="max-w-2xl text-lg text-ivory/65">
              Physical editions, digital releases and selected collectables from the Wareham Music
              Group catalogue. Browse official WMG releases and purchase directly through each
              item's dedicated store page.
            </p>
            <p className="mt-8 text-[13px] uppercase tracking-[0.24em] font-bold text-gold">
              Available to purchase and ship worldwide!
            </p>
          </div>
          <div className="relative hidden min-h-[360px] lg:block">
            <div className="absolute right-0 top-1/2 h-[560px] w-full -translate-y-1/2 overflow-hidden [-webkit-mask-image:linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.08)_14%,rgba(0,0,0,0.42)_26%,black_44%,black_56%,rgba(0,0,0,0.42)_74%,rgba(0,0,0,0.08)_86%,transparent_100%)] [mask-image:linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.08)_14%,rgba(0,0,0,0.42)_26%,black_44%,black_56%,rgba(0,0,0,0.42)_74%,rgba(0,0,0,0.08)_86%,transparent_100%)] [mask-repeat:no-repeat] [mask-size:100%_100%]">
              <div className="h-full w-full [-webkit-mask-image:radial-gradient(ellipse_at_center,black_18%,rgba(0,0,0,0.68)_38%,rgba(0,0,0,0.28)_58%,transparent_78%)] [mask-image:radial-gradient(ellipse_at_center,black_18%,rgba(0,0,0,0.68)_38%,rgba(0,0,0,0.28)_58%,transparent_78%)] [mask-repeat:no-repeat] [mask-size:100%_100%]">
                <div
                  aria-hidden="true"
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${storeHeroUrl})` }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-ink" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gold/35" aria-hidden="true" />
      </section>

      <div className="container-editorial pt-16">
        {isLoading ? (
          <InlineSkeleton count={6} />
        ) : !hasAnyVisible ? (
          <div className="max-w-2xl py-16">
            <p className="eyebrow mb-4">Coming Soon</p>
            <h2 className="display-serif text-3xl md:text-4xl mb-6">The store is being prepared.</h2>
            <p className="text-ivory/65">
              We're getting the next batch of records ready. Check back shortly, or follow the journal
              for release news.
            </p>
          </div>
        ) : (
          <>
            {featured.length > 0 && (
              <section className="mb-16">
                <div className="mb-6">
                  <p className="eyebrow mb-2 text-gold-soft">Featured</p>
                  <h2 className="display-serif text-3xl md:text-4xl">Featured in the Store</h2>
                </div>
                <div className="grid grid-cols-1 gap-8">
                  {featured.map((item) => (
                    <StoreCard key={item.id} item={item} variant="featured" />
                  ))}
                </div>
                <div className="mt-10 h-px w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent" aria-hidden="true" />
              </section>
            )}

            {rest.length > 0 ? (
              <section>
                {featured.length > 0 && (
                  <div className="mb-6">
                    <p className="eyebrow mb-2 text-gold-soft">The Store</p>
                    <h2 className="display-serif text-3xl md:text-4xl">All Items</h2>
                  </div>
                )}
                <div className="flex flex-wrap items-end justify-between gap-y-6 mb-10 border-y border-ivory/18 py-6">
                  <div className="flex flex-wrap items-end gap-x-8 gap-y-6">
                    <FilterField label="Format / Type">
                      <Select value={formatTypeFilter} onValueChange={(v) => setFormatTypeFilter(v)}>
                        <SelectTrigger className="w-[200px] bg-transparent border-ivory/24 text-[11px] uppercase tracking-[0.24em] text-ivory rounded-none focus:ring-ivory">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-ink text-ivory border-ivory/24">
                          <SelectItem value="All" className="text-[11px] uppercase tracking-[0.24em] focus:bg-ivory/10 focus:text-ivory">
                            All
                          </SelectItem>
                          {availableFormats.length > 0 && (
                            <SelectSeparator className="bg-ivory/15" />
                          )}
                          {availableFormats.map((f) => (
                            <SelectItem
                              key={`fmt-${f}`}
                              value={`fmt:${f}`}
                              className="text-[11px] uppercase tracking-[0.24em] focus:bg-ivory/10 focus:text-ivory"
                            >
                              {f}
                            </SelectItem>
                          ))}
                          {availableTypes.length > 0 && (
                            <SelectSeparator className="bg-ivory/15" />
                          )}
                          {availableTypes.map((t) => (
                            <SelectItem
                              key={`type-${t}`}
                              value={`type:${t}`}
                              className="text-[11px] uppercase tracking-[0.24em] focus:bg-ivory/10 focus:text-ivory"
                            >
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FilterField>
                  </div>
                  <div className="flex flex-wrap items-end gap-x-8 gap-y-6">
                    <FilterField label="Search">
                      <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search title or artist"
                      />
                    </FilterField>
                    <FilterField label="Sort by">
                      <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                        <SelectTrigger className="w-[200px] bg-transparent border-ivory/24 text-[11px] uppercase tracking-[0.24em] text-ivory rounded-none focus:ring-ivory">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent className="bg-ink text-ivory border-ivory/24">
                          {sortOptions.map((o) => (
                            <SelectItem key={o} value={o} className="text-[11px] uppercase tracking-[0.24em] focus:bg-ivory/10 focus:text-ivory">
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FilterField>
                  </div>
                </div>
                <div className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-2 lg:grid-cols-3 md:gap-10">
                  {rest.map((item) => (
                    <StoreCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ) : (
              <p className="py-8 text-ivory/60">No store items match the selected filters.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Store;
