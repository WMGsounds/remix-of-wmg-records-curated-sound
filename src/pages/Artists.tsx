import { useMemo, useState } from "react";
import { ArtistCard } from "@/components/Cards";
import { PageTitle } from "@/components/PageTitle";
import { useArtists } from "@/lib/queries";
import { InlineSkeleton, PageError } from "@/components/UIStates";

const Artists = () => {
  const { data: artists = [], isLoading, isError } = useArtists();
  const genres = useMemo(() => {
    const set = new Set(artists.flatMap((a) => a.genre.split(",").map((g) => g.trim()).filter(Boolean)));
    return ["All", ...Array.from(set)];
  }, [artists]);
  const [filter, setFilter] = useState<string>("All");

  const visible = useMemo(
    () => (filter === "All" ? artists : artists.filter((a) => a.genre.split(",").map((g) => g.trim()).includes(filter))),
    [filter, artists],
  );

  if (isError) return <PageError message="Couldn't load the roster." />;

  return (
    <div className="pt-40 pb-32">
      <PageTitle title="Artists" />
      <div className="container-editorial">
        <p className="eyebrow mb-6">The Roster</p>
        <h1 className="display-serif text-6xl md:text-8xl lg:text-9xl mb-10">Artists</h1>
        <p className="max-w-2xl text-lg text-muted-foreground mb-16">
          Singular voices, carefully chosen. Each artist on WMG is given the space and time to build
          a body of work — without compromise.
        </p>

        {!isLoading && genres.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-16 border-y border-border py-5">
            {genres.map((f) => (
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
        )}

        {isLoading ? (
          <InlineSkeleton count={6} />
        ) : visible.length === 0 ? (
          <p className="text-muted-foreground py-20">No artists to show.</p>
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
