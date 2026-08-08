import { useMemo, useState } from "react";
import { Seo } from "@/components/Seo";
import { breadcrumbSchema, imageObjectSchema } from "@/lib/seo";
import { useStoreItems } from "@/lib/queries";
import { InlineSkeleton, PageError } from "@/components/UIStates";
import { StoreCard } from "@/components/StoreCard";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterField, SearchInput } from "@/components/FilterBar";
import { matchesSearch } from "@/lib/search";
import type { StoreItem, StoreFormat } from "@/lib/types";

const storeHeroUrl = "data:image/webp;base64,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";

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
        jsonLd={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Store", path: "/store" },
          ]),
          ...productImageSchema,
        ]}
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
