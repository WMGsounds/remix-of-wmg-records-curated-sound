import { useMemo, useState } from "react";
import { ArtistCard } from "@/components/Cards";
import { PageTitle } from "@/components/PageTitle";
import { useArtists } from "@/lib/queries";
import { InlineSkeleton, PageError } from "@/components/UIStates";

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
    <div className="bg-ink text-ivory pt-40 pb-32">
      <PageTitle title="Artists" />
      <div className="container-editorial">
        <p className="eyebrow text-ivory/60 mb-6">The Roster</p>
        <h1 className="display-serif text-6xl md:text-8xl lg:text-9xl mb-10">Artists</h1>
        <p className="max-w-2xl text-lg text-ivory/65 mb-16">
          Singular voices, carefully chosen. Each artist on WMG is given the space and time to build
          a body of work — without compromise.
        </p>

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
