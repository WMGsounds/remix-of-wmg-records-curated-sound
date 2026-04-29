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
            <div className="absolute -right-44 top-1/2 h-[520px] w-[86%] -translate-y-1/2 overflow-hidden [mask-image:radial-gradient(ellipse_at_58%_48%,black_0%,black_24%,rgba(0,0,0,0.55)_42%,transparent_70%)] [mask-repeat:no-repeat] [mask-size:100%_100%]">
              <img
                src={artistsHeroStudio}
                alt="Monochrome studio detail with microphone and vinyl"
                width={1280}
                height={960}
                className="h-full w-full object-cover grayscale saturate-50 opacity-42 mix-blend-lighten"
              />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_58%_48%,transparent_0%,hsl(var(--ink)/0.12)_34%,hsl(var(--ink))_76%),linear-gradient(90deg,hsl(var(--ink))_0%,transparent_34%,transparent_58%,hsl(var(--ink))_100%),linear-gradient(180deg,hsl(var(--ink))_0%,transparent_24%,transparent_70%,hsl(var(--ink))_100%)]" aria-hidden="true" />
              <div className="absolute inset-0 bg-ink/35 mix-blend-multiply" aria-hidden="true" />
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
