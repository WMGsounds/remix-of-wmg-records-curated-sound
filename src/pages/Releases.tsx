import { useMemo, useState } from "react";
import { ReleaseCard } from "@/components/Cards";
import { PageTitle } from "@/components/PageTitle";
import { useReleases } from "@/lib/queries";
import { InlineSkeleton, PageError } from "@/components/UIStates";
import releasesHeroVinyl from "@/assets/releases-hero-vinyl.png";

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
    <div className="bg-ink text-ivory pb-32">
      <PageTitle title="Releases" />
      <section className="relative overflow-hidden bg-ink pt-40 pb-24 md:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,hsl(var(--golden-brown)/0.24),transparent_28%),radial-gradient(circle_at_30%_36%,hsl(var(--gold)/0.10),transparent_30%)]" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(90deg,hsl(var(--ivory)/0.72)_1px,transparent_1px),linear-gradient(0deg,hsl(var(--ivory)/0.72)_1px,transparent_1px)] [background-size:3px_3px]" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_38%,hsl(var(--ink)/0.72)_100%)]" aria-hidden="true" />
        <div className="relative container-editorial grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow text-ivory/60 mb-6">The Catalogue</p>
            <h1 className="display-serif text-6xl md:text-8xl lg:text-9xl mb-10">Releases</h1>
            <p className="max-w-2xl text-lg text-ivory/65">
              Every WMG release is built to last — from the songwriting to the sleeve. Browse the full
              catalogue below.
            </p>
          </div>
          <div className="relative hidden min-h-[360px] lg:block">
            <div className="absolute right-0 top-1/2 h-[560px] w-full -translate-y-1/2 overflow-hidden [-webkit-mask-image:linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.08)_14%,rgba(0,0,0,0.42)_26%,black_44%,black_56%,rgba(0,0,0,0.42)_74%,rgba(0,0,0,0.08)_86%,transparent_100%)] [mask-image:linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.08)_14%,rgba(0,0,0,0.42)_26%,black_44%,black_56%,rgba(0,0,0,0.42)_74%,rgba(0,0,0,0.08)_86%,transparent_100%)] [mask-repeat:no-repeat] [mask-size:100%_100%]">
              <div className="h-full w-full [-webkit-mask-image:radial-gradient(ellipse_at_center,black_18%,rgba(0,0,0,0.68)_38%,rgba(0,0,0,0.28)_58%,transparent_78%)] [mask-image:radial-gradient(ellipse_at_center,black_18%,rgba(0,0,0,0.68)_38%,rgba(0,0,0,0.28)_58%,transparent_78%)] [mask-repeat:no-repeat] [mask-size:100%_100%]">
                <img
                  src={releasesHeroVinyl}
                  alt="Low-lit vinyl record on a turntable"
                  width={1280}
                  height={960}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-ink" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gold/35" aria-hidden="true" />
      </section>

      <div className="container-editorial pt-16">

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
