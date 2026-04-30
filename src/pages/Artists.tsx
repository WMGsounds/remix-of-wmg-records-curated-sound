import { useMemo, useState } from "react";
import { ArtistCard } from "@/components/Cards";
import { PageTitle } from "@/components/PageTitle";
import { useArtists } from "@/lib/queries";
import { InlineSkeleton, PageError } from "@/components/UIStates";
const artistsHeroDataUrl = "data:image/webp;base64,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";

const sortOptions = ["Artist Name", "Genre"] as const;

const Artists = () => {
  const { data: artists = [], isLoading, isError } = useArtists();
  const genres = useMemo(() => {
    const set = new Set(artists.flatMap((a) => a.genre.split(",").map((g) => g.trim()).filter(Boolean)));
    return ["All", ...Array.from(set)];
  }, [artists]);
  const [filter, setFilter] = useState<string>("All");
  const [sort, setSort] = useState<(typeof sortOptions)[number]>("Artist Name");

  const visible = useMemo(() => {
    const list = filter === "All"
      ? [...artists]
      : artists.filter((a) => a.genre.split(",").map((g) => g.trim()).includes(filter));

    switch (sort) {
      case "Genre":
        return list.sort((a, b) => a.genre.localeCompare(b.genre) || a.name.localeCompare(b.name));
      case "Artist Name":
      default:
        return list.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [filter, sort, artists]);

  if (isError) return <PageError message="Couldn't load the roster." />;

  return (
    <div className="bg-ink text-ivory pb-32">
      <PageTitle title="Artists" />
      <section className="relative overflow-hidden bg-ink pt-40 pb-24 md:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,hsl(var(--golden-brown)/0.24),transparent_28%),radial-gradient(circle_at_30%_36%,hsl(var(--gold)/0.10),transparent_30%)]" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(90deg,hsl(var(--ivory)/0.72)_1px,transparent_1px),linear-gradient(0deg,hsl(var(--ivory)/0.72)_1px,transparent_1px)] [background-size:3px_3px]" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_38%,hsl(var(--ink)/0.72)_100%)]" aria-hidden="true" />
        <div className="relative container-editorial grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow text-ivory/60 mb-6">The Roster</p>
            <h1 className="display-serif text-6xl md:text-8xl lg:text-9xl mb-10">Artists</h1>
            <p className="max-w-2xl text-lg text-ivory/65">
              Singular voices, carefully chosen. Each artist on WMG is given the space and time to build
              a body of work — without compromise.
            </p>
          </div>
          <div className="relative hidden min-h-[360px] lg:block">
            <div className="absolute right-0 top-1/2 h-[560px] w-full -translate-y-1/2 overflow-hidden [-webkit-mask-image:linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.08)_14%,rgba(0,0,0,0.42)_26%,black_44%,black_56%,rgba(0,0,0,0.42)_74%,rgba(0,0,0,0.08)_86%,transparent_100%)] [mask-image:linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.08)_14%,rgba(0,0,0,0.42)_26%,black_44%,black_56%,rgba(0,0,0,0.42)_74%,rgba(0,0,0,0.08)_86%,transparent_100%)] [mask-repeat:no-repeat] [mask-size:100%_100%]">
              <div className="h-full w-full [-webkit-mask-image:radial-gradient(ellipse_at_center,black_18%,rgba(0,0,0,0.68)_38%,rgba(0,0,0,0.28)_58%,transparent_78%)] [mask-image:radial-gradient(ellipse_at_center,black_18%,rgba(0,0,0,0.68)_38%,rgba(0,0,0,0.28)_58%,transparent_78%)] [mask-repeat:no-repeat] [mask-size:100%_100%]">
                <div
                  aria-hidden="true"
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${artistsHeroDataUrl})` }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-ink" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gold/35" aria-hidden="true" />
      </section>

      <div className="container-editorial pt-16">

        {!isLoading && genres.length > 1 && (
          <div className="flex flex-row flex-wrap items-center justify-between gap-4 mb-16 border-y border-ivory/18 py-5">
            {/* Mobile: filter as dropdown */}
            <div className="md:hidden">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-transparent border border-ivory/24 text-[11px] uppercase tracking-[0.24em] px-3 py-2 text-ivory focus:outline-none focus:ring-1 focus:ring-ivory cursor-pointer"
              >
                {genres.map((f) => (
                  <option key={f} value={f} className="bg-ink text-ivory">
                    {f}
                  </option>
                ))}
              </select>
            </div>
            {/* Desktop: filter as buttons */}
            <div className="hidden md:flex flex-wrap gap-2">
              {genres.map((f) => (
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
              <label className="hidden md:inline text-[11px] uppercase tracking-[0.24em] text-ivory/60">Sort by</label>
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
        )}

        {isLoading ? (
          <InlineSkeleton count={6} />
        ) : visible.length === 0 ? (
          <p className="text-ivory/60 py-20">No artists to show.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {visible.map((a) => <ArtistCard key={a.slug} artist={a} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Artists;
