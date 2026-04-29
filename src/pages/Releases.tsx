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
  const [sort, setSort] = useState<(typeof sortOptions)[number]>("Release Name");

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
    <div className="relative overflow-hidden bg-ink text-ivory pt-40 pb-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_38%,hsl(var(--golden-brown)/0.38),transparent_34%),radial-gradient(circle_at_18%_78%,hsl(var(--gold)/0.16),transparent_28%)]" aria-hidden="true" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,hsl(var(--ivory)/0.8)_1px,transparent_1px),linear-gradient(0deg,hsl(var(--ivory)/0.8)_1px,transparent_1px)] [background-size:3px_3px]" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_42%,hsl(var(--ink)/0.72)_100%)]" aria-hidden="true" />
      <PageTitle title="Releases" />
      <div className="relative container-editorial">
        <p className="eyebrow text-gold-soft mb-6">The Catalogue</p>
        <h1 className="display-serif text-6xl md:text-8xl lg:text-9xl mb-10">Releases</h1>
        <p className="max-w-2xl text-lg text-ivory/70 mb-16">
          Every WMG release is built to last — from the songwriting to the sleeve. Browse the full
          catalogue below.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-16 border-y border-ivory/18 py-5">
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[11px] uppercase tracking-[0.24em] px-4 py-2 transition-colors duration-300 ${
                  filter === f ? "bg-ivory text-ink" : "text-ivory/60 hover:text-ivory"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[11px] uppercase tracking-[0.24em] text-ivory/60">Sort by</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as (typeof sortOptions)[number])}
              className="bg-transparent border border-ivory/24 text-[11px] uppercase tracking-[0.24em] px-3 py-2 text-ivory focus:outline-none focus:ring-1 focus:ring-ivory cursor-pointer"
            >
              {sortOptions.map((o) => (
                <option key={o} value={o} className="bg-ink text-ivory">
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <InlineSkeleton count={8} />
        ) : visible.length === 0 ? (
          <p className="text-ivory/60 py-20">No releases match this filter.</p>
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
