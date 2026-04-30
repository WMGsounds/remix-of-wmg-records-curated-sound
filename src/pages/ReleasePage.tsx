import { useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ChevronDown, Play } from "lucide-react";
import { useReleaseBySlug } from "@/lib/queries";
import { PageTitle } from "@/components/PageTitle";
import { PageLoading, PageError } from "@/components/UIStates";
import type { Track } from "@/lib/types";

const getSpotifyTrackId = (rawUrl?: string | null): string | null => {
  if (!rawUrl) return null;
  try {
    const u = new URL(rawUrl);
    if (!u.hostname.includes("spotify.com")) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p === "track");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    return null;
  } catch {
    return null;
  }
};

const TrackRow = ({
  track,
  previewOpen,
  onTogglePreview,
}: {
  track: Track;
  previewOpen: boolean;
  onTogglePreview: () => void;
}) => {
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const hasLyrics = !!track.lyrics && track.lyrics.trim().length > 0;
  const spotifyTrackId = getSpotifyTrackId(track.spotifyUrl);

  return (
    <li className="border-b border-ivory/15 last:border-b-0">
      <div className="flex items-baseline justify-between py-5 group hover:text-gold transition-colors duration-300">
        <span className="flex items-baseline gap-6 min-w-0">
          <span className="text-xs text-ivory/55 tabular-nums w-6 shrink-0">
            {String(track.trackNumber).padStart(2, "0")}
          </span>
          <span className="font-serif text-xl md:text-2xl truncate">{track.trackTitle}</span>
        </span>
        <span className="flex items-center gap-6 shrink-0">
          <span className="text-xs text-ivory/55 tabular-nums">{track.duration}</span>
          {spotifyTrackId && (
            <button
              onClick={onTogglePreview}
              className="text-[10px] uppercase tracking-[0.24em] text-ivory/55 hover:text-ivory inline-flex items-center gap-1.5"
              aria-expanded={previewOpen}
              aria-label={previewOpen ? "Close Spotify preview" : "Open Spotify preview"}
            >
              <Play className="h-3 w-3" />
              Listen
            </button>
          )}
          {hasLyrics && (
            <button
              onClick={() => setLyricsOpen((o) => !o)}
              className="text-[10px] uppercase tracking-[0.24em] text-ivory/55 hover:text-ivory inline-flex items-center gap-1.5"
              aria-expanded={lyricsOpen}
            >
              Lyrics
              <ChevronDown className={`h-3 w-3 transition-transform ${lyricsOpen ? "rotate-180" : ""}`} />
            </button>
          )}
        </span>
      </div>
      {spotifyTrackId && previewOpen && (
        <div className="pb-6 pl-12 pr-4">
          <iframe
            title={`Spotify preview – ${track.trackTitle}`}
            src={`https://open.spotify.com/embed/track/${spotifyTrackId}?utm_source=generator`}
            width="100%"
            height="80"
            frameBorder={0}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded"
          />
        </div>
      )}
      {hasLyrics && lyricsOpen && (
        <div className="pb-8 pl-12 pr-4 text-ivory/80 whitespace-pre-line font-serif text-base leading-relaxed">
          {track.lyrics}
        </div>
      )}
    </li>
  );
};

const ReleasePage = () => {
  const { slug } = useParams();
  const { data, isLoading, isError } = useReleaseBySlug(slug);
  const [openPreviewTrackId, setOpenPreviewTrackId] = useState<string | null>(null);

  if (isLoading) return <PageLoading label="Opening release" />;
  if (isError) return <PageError />;
  if (!data) return <Navigate to="/releases" replace />;

  const { release, artist, tracks, related } = data;
  const releaseDate = release.releaseDate ? new Date(release.releaseDate) : null;
  const monthYear = releaseDate && !Number.isNaN(releaseDate.getTime())
    ? releaseDate.toLocaleDateString(undefined, { month: "long", year: "numeric" }).toUpperCase()
    : "TBC";
  const dateLabel = releaseDate && !Number.isNaN(releaseDate.getTime()) ? releaseDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }) : "Release date TBC";

  return (
    <div>
      <PageTitle title={release.title} />
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-ivory pt-52 md:pt-60 pb-20 md:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_38%,hsl(var(--golden-brown)/0.38),transparent_34%),radial-gradient(circle_at_18%_78%,hsl(var(--gold)/0.16),transparent_28%)]" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,hsl(var(--ivory)/0.8)_1px,transparent_1px),linear-gradient(0deg,hsl(var(--ivory)/0.8)_1px,transparent_1px)] [background-size:3px_3px]" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_42%,hsl(var(--ink)/0.72)_100%)]" aria-hidden="true" />
        <div className="relative container-editorial grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          <div className="lg:col-span-5">
            <div className="overflow-hidden aspect-square shadow-[var(--shadow-soft)] max-w-[460px] mx-auto lg:mx-0">
              {release.coverArt ? (
                <img src={release.coverArt} alt={release.title} loading="eager" fetchPriority="high" width={1200} height={1200} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-ivory/10 flex items-center justify-center text-ivory/60">Artwork coming soon.</div>
              )}
            </div>
          </div>
          <div className="lg:col-span-7">
            <p className="eyebrow text-gold-soft mb-4">{release.releaseType} · {monthYear}</p>
            <h1 className="display-serif text-6xl md:text-8xl mb-6">{release.title}</h1>
            {artist && (
              <Link to={`/artists/${encodeURIComponent(artist.slug)}`} className="font-serif italic text-2xl md:text-3xl text-ivory/82 link-underline">
                {artist.name}
              </Link>
            )}
            <p className="text-sm text-ivory/60 mt-6">{dateLabel}</p>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="bg-ink text-ivory py-16 md:py-20">
        <div className="container-editorial">
          <p className="text-left leading-relaxed text-base md:text-lg text-ivory/82 max-w-3xl">
            {release.fullDescription || release.shortDescription}
          </p>
        </div>
      </section>

      {/* Tracklist + Credits */}
      <section className="relative overflow-hidden bg-ink text-ivory py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_38%,hsl(var(--golden-brown)/0.38),transparent_34%),radial-gradient(circle_at_18%_78%,hsl(var(--gold)/0.16),transparent_28%)]" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,hsl(var(--ivory)/0.8)_1px,transparent_1px),linear-gradient(0deg,hsl(var(--ivory)/0.8)_1px,transparent_1px)] [background-size:3px_3px]" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_42%,hsl(var(--ink)/0.72)_100%)]" aria-hidden="true" />
        <div className="relative container-editorial grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-7">
            <p className="eyebrow text-gold-soft mb-8">Tracklist</p>
            {tracks.length === 0 ? (
              <p className="text-ivory/60">Tracklist coming soon.</p>
            ) : (
              <ol className="border-y border-ivory/15">
                {tracks.map((t) => (
                  <TrackRow
                    key={t.id}
                    track={t}
                    previewOpen={openPreviewTrackId === t.id}
                    onTogglePreview={() =>
                      setOpenPreviewTrackId((curr) => (curr === t.id ? null : t.id))
                    }
                  />
                ))}
              </ol>
            )}
          </div>
          <div className="lg:col-span-5">
            <p className="eyebrow text-gold-soft mb-8">Credits</p>
            <ul className="space-y-3 text-ivory/82">
              {release.catalogueId && <li>Catalogue: {release.catalogueId}</li>}
              <li>Released {dateLabel}</li>
              {artist && <li>{artist.name}</li>}
              <li className="text-ivory/60 italic text-sm pt-2">Additional credits coming soon.</li>
            </ul>
            {release.streamingLinks?.spotify && (
              <a
                href={release.streamingLinks.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 border border-ivory/30 px-6 py-3 text-[11px] uppercase tracking-[0.28em] text-ivory hover:bg-ivory hover:text-ink transition-colors duration-300"
              >
                <Play className="h-3.5 w-3.5" />
                Listen on Spotify
              </a>
            )}
          </div>
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
                      <img src={r.coverArt} alt={r.title} loading="lazy" width={1200} height={1200} className="h-full w-full object-cover" />
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
