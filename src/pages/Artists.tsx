import { useMemo, useState } from "react";
import { ArtistCard } from "@/components/Cards";
import { PageTitle } from "@/components/PageTitle";
import { useArtists } from "@/lib/queries";
import { InlineSkeleton, PageError } from "@/components/UIStates";
import artistsHeroStudio from "@/assets/artists-hero-studio.jpg";

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
                <img
                  src={artistsHeroStudio}
                  alt="Monochrome studio detail with microphone and vinyl"
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

        {!isLoading && genres.length > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-16 border-y border-ivory/18 py-5">
            <div className="flex flex-wrap gap-2">
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
