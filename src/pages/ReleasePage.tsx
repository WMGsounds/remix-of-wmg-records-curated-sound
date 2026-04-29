import { useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useReleaseBySlug } from "@/lib/queries";
import { PageLoading, PageError } from "@/components/UIStates";
import type { Track, StreamingLinks } from "@/lib/types";

const STREAMING_LABELS: { key: keyof StreamingLinks; label: string }[] = [
  { key: "spotify", label: "Spotify" },
  { key: "appleMusic", label: "Apple Music" },
  { key: "bandcamp", label: "Bandcamp" },
  { key: "tidal", label: "Tidal" },
  { key: "youtubeMusic", label: "YouTube Music" },
  { key: "amazonMusic", label: "Amazon Music" },
];

const TrackRow = ({ track }: { track: Track }) => {
  const [open, setOpen] = useState(false);
  const hasLyrics = !!track.lyrics && track.lyrics.trim().length > 0;
  return (
    <li className="border-b border-border last:border-b-0">
      <div className="flex items-baseline justify-between py-5 group hover:text-accent transition-colors duration-300">
        <span className="flex items-baseline gap-6 min-w-0">
          <span className="text-xs text-muted-foreground tabular-nums w-6 shrink-0">
            {String(track.trackNumber).padStart(2, "0")}
          </span>
          <span className="font-serif text-xl md:text-2xl truncate">{track.trackTitle}</span>
        </span>
        <span className="flex items-center gap-6 shrink-0">
          <span className="text-xs text-muted-foreground tabular-nums">{track.duration}</span>
          {hasLyrics && (
            <button
              onClick={() => setOpen((o) => !o)}
              className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
              aria-expanded={open}
            >
              Lyrics
              <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          )}
        </span>
      </div>
      {hasLyrics && open && (
        <div className="pb-8 pl-12 pr-4 text-foreground/80 whitespace-pre-line font-serif text-base leading-relaxed">
          {track.lyrics}
        </div>
      )}
    </li>
  );
};

const ReleasePage = () => {
  const { slug } = useParams();
  const { data, isLoading, isError } = useReleaseBySlug(slug);

  if (isLoading) return <PageLoading label="Opening release" />;
  if (isError) return <PageError />;
  if (!data) return <Navigate to="/releases" replace />;

  const { release, artist, tracks, related } = data;
  const releaseDate = release.releaseDate ? new Date(release.releaseDate) : null;
  const year = releaseDate && !Number.isNaN(releaseDate.getTime()) ? releaseDate.getFullYear() : "TBC";
  const dateLabel = releaseDate && !Number.isNaN(releaseDate.getTime()) ? releaseDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }) : "Release date TBC";

  const streamingEntries = STREAMING_LABELS.filter(({ key }) => release.streamingLinks[key]);

  return (
    <div className="pt-32">
      {/* Hero */}
      <section className="container-editorial pb-20 md:pb-28 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-end">
        <div className="lg:col-span-6">
          <div className="overflow-hidden aspect-square shadow-[var(--shadow-soft)]">
            {release.coverArt ? (
              <img src={release.coverArt} alt={release.title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-muted flex items-center justify-center text-muted-foreground">Artwork coming soon.</div>
            )}
          </div>
        </div>
        <div className="lg:col-span-6">
          <p className="eyebrow mb-4">{release.releaseType} · {year}</p>
          <h1 className="display-serif text-6xl md:text-8xl mb-6">{release.title}</h1>
          {artist && (
            <Link to={`/artists/${encodeURIComponent(artist.slug)}`} className="font-serif italic text-2xl md:text-3xl link-underline">
              {artist.name}
            </Link>
          )}
          <p className="text-sm text-muted-foreground mt-6">{dateLabel}</p>
        </div>
      </section>

      {/* Description */}
      <section className="bg-secondary py-24">
        <div className="container-editorial max-w-3xl">
          <p className="display-serif text-3xl md:text-4xl italic leading-[1.25]">
            {release.fullDescription || release.shortDescription}
          </p>
        </div>
      </section>

      {/* Tracklist + Credits */}
      <section className="container-editorial py-28 grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-7">
          <p className="eyebrow mb-8">Tracklist</p>
          {tracks.length === 0 ? (
            <p className="text-muted-foreground">Tracklist coming soon.</p>
          ) : (
            <ol className="border-y border-border">
              {tracks.map((t) => <TrackRow key={t.id} track={t} />)}
            </ol>
          )}
        </div>
        <div className="lg:col-span-5">
          <p className="eyebrow mb-8">Credits</p>
          <ul className="space-y-3 text-foreground/80">
            {release.catalogueId && <li>Catalogue: {release.catalogueId}</li>}
            <li>Released {dateLabel}</li>
            {artist && <li>{artist.name}</li>}
            <li className="text-muted-foreground italic text-sm pt-2">Additional credits coming soon.</li>
          </ul>

          <p className="eyebrow mt-14 mb-6">Listen</p>
          {streamingEntries.length === 0 ? (
            <p className="text-muted-foreground text-sm">Streaming links coming soon.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {streamingEntries.map(({ key, label }) => (
                <a
                  key={key}
                  href={release.streamingLinks[key]}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="border border-foreground px-5 py-2.5 text-[11px] uppercase tracking-[0.24em] hover:bg-foreground hover:text-background transition-colors duration-500"
                >
                  {label}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="bg-ink text-ivory py-28">
          <div className="container-editorial">
            <p className="eyebrow text-ivory/60 mb-4">More from {artist?.name ?? "this artist"}</p>
            <h2 className="display-serif text-5xl md:text-6xl mb-16">Related Releases</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              {related.map((r) => (
                <Link key={r.slug} to={`/releases/${encodeURIComponent(r.slug)}`} className="group block hover-zoom cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory">
                  <div className="overflow-hidden aspect-square">
                    {r.coverArt ? (
                      <img src={r.coverArt} alt={r.title} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-ivory/10 flex items-center justify-center p-4 text-center text-ivory/60">Artwork coming soon.</div>
                    )}
                  </div>
                  <h3 className="font-serif text-2xl mt-4">{r.title}</h3>
                  <p className="text-xs text-ivory/60 mt-1">{r.artistName}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ReleasePage;
