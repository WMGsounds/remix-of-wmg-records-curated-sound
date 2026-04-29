import { useMemo, useState } from "react";
import { ReleaseCard } from "@/components/Cards";
import { PageTitle } from "@/components/PageTitle";
import { useReleases } from "@/lib/queries";
import { InlineSkeleton, PageError } from "@/components/UIStates";

const filters = ["All", "Single", "Album", "EP"] as const;
const sortOptions = ["Release Date", "Artist Name", "Release Name"] as const;

const Releases = () => {
  const { data: releases = [], isLoading, isError } = useReleases();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [sort, setSort] = useState<(typeof sortOptions)[number]>("Release Date");

  const visible = useMemo(() => {
    const list = filter === "All" ? [...releases] : releases.filter((r) => r.releaseType === filter);
    switch (sort) {
      case "Artist Name":
        return list.sort((a, b) => a.artistName.localeCompare(b.artistName));
      case "Release Name":
        return list.sort((a, b) => a.title.localeCompare(b.title));
      case "Release Date":
      default:
        return list.sort(
          (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime(),
        );
    }
  }, [filter, sort, releases]);

  if (isError) return <PageError message="Couldn't load the catalogue." />;

  return (
    <div className="pt-40 pb-32">
      <PageTitle title="Releases" />
      <div className="container-editorial">
        <p className="eyebrow mb-6">The Catalogue</p>
        <h1 className="display-serif text-6xl md:text-8xl lg:text-9xl mb-10">Releases</h1>
        <p className="max-w-2xl text-lg text-muted-foreground mb-16">
          Every WMG release is built to last — from the songwriting to the sleeve. Browse the full
          catalogue below.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-16 border-y border-border py-5">
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[11px] uppercase tracking-[0.24em] px-4 py-2 transition-colors duration-300 ${
                  filter === f ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Sort by</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as (typeof sortOptions)[number])}
              className="bg-transparent border border-border text-[11px] uppercase tracking-[0.24em] px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-foreground cursor-pointer"
            >
              {sortOptions.map((o) => (
                <option key={o} value={o} className="bg-background text-foreground">
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <InlineSkeleton count={8} />
        ) : visible.length === 0 ? (
          <p className="text-muted-foreground py-20">No releases match this filter.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-10">
            {visible.map((r) => <ReleaseCard key={r.slug} release={r} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Releases;
