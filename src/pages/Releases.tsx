import { useMemo, useState } from "react";
import { ReleaseCard } from "@/components/Cards";
import { Seo } from "@/components/Seo";
import { breadcrumbSchema } from "@/lib/seo";
import { useReleases } from "@/lib/queries";
import { InlineSkeleton, PageError } from "@/components/UIStates";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const releasesHeroDataUrl = "data:image/webp;base64,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";

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
      <Seo
        title="Releases | WMG Records Catalogue"
        description="Browse the WMG Records catalogue, including singles, double singles and albums from Betty Blane, Bobby Chills, Tony Medley, Jack Rivers and more."
        canonicalPath="/releases"
        jsonLd={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Releases", path: "/releases" },
        ])}
      />
      <section className="relative overflow-hidden bg-ink pt-40 pb-24 md:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_38%,hsl(var(--golden-brown)/0.38),transparent_34%),radial-gradient(circle_at_18%_78%,hsl(var(--gold)/0.16),transparent_28%)]" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,hsl(var(--ivory)/0.8)_1px,transparent_1px),linear-gradient(0deg,hsl(var(--ivory)/0.8)_1px,transparent_1px)] [background-size:3px_3px]" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_42%,hsl(var(--ink)/0.72)_100%)]" aria-hidden="true" />
        <div className="relative container-editorial grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow mb-6 text-gold-soft">The Catalogue</p>
            <h1 className="display-serif text-6xl md:text-8xl lg:text-9xl mb-10">Releases</h1>
            <p className="max-w-2xl text-lg text-ivory/65">
              Every WMG release is built to last — from the songwriting to the sleeve. Browse the full
              catalogue below.
            </p>
          </div>
          <div className="relative hidden min-h-[360px] lg:block">
            <div className="absolute right-0 top-1/2 h-[560px] w-full -translate-y-1/2 overflow-hidden [-webkit-mask-image:linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.08)_14%,rgba(0,0,0,0.42)_26%,black_44%,black_54%,rgba(0,0,0,0.42)_70%,rgba(0,0,0,0.08)_82%,transparent_98%)] [mask-image:linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.08)_14%,rgba(0,0,0,0.42)_26%,black_44%,black_54%,rgba(0,0,0,0.42)_70%,rgba(0,0,0,0.08)_82%,transparent_98%)] [mask-repeat:no-repeat] [mask-size:100%_100%]">
              <div className="h-full w-full [-webkit-mask-image:radial-gradient(ellipse_at_center,black_18%,rgba(0,0,0,0.68)_38%,rgba(0,0,0,0.28)_58%,transparent_78%)] [mask-image:radial-gradient(ellipse_at_center,black_18%,rgba(0,0,0,0.68)_38%,rgba(0,0,0,0.28)_58%,transparent_78%)] [mask-repeat:no-repeat] [mask-size:100%_100%]">
                <div
                  aria-hidden="true"
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${releasesHeroDataUrl})` }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-ink" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gold/35" aria-hidden="true" />
      </section>

      <div className="container-editorial pt-16">

        <div className="flex flex-row flex-wrap items-center justify-between gap-4 mb-16 border-y border-ivory/18 py-5">
          <div className="flex items-center gap-3">
            <label className="hidden md:inline text-[11px] uppercase tracking-[0.24em] text-ivory/60">Type</label>
            <Select value={filter} onValueChange={(v) => setFilter(v as (typeof filters)[number])}>
              <SelectTrigger className="w-[160px] bg-transparent border-ivory/24 text-[11px] uppercase tracking-[0.24em] text-ivory rounded-none focus:ring-ivory">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-ink text-ivory border-ivory/24">
                {filters.map((f) => (
                  <SelectItem key={f} value={f} className="text-[11px] uppercase tracking-[0.24em] focus:bg-ivory/10 focus:text-ivory">
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <label className="hidden md:inline text-[11px] uppercase tracking-[0.24em] text-ivory/60">Sort by</label>
            <Select value={sort} onValueChange={(v) => setSort(v as (typeof sortOptions)[number])}>
              <SelectTrigger className="w-[180px] bg-transparent border-ivory/24 text-[11px] uppercase tracking-[0.24em] text-ivory rounded-none focus:ring-ivory">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-ink text-ivory border-ivory/24">
                {sortOptions.map((o) => (
                  <SelectItem key={o} value={o} className="text-[11px] uppercase tracking-[0.24em] focus:bg-ivory/10 focus:text-ivory">
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
