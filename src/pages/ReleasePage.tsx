import { useEffect, useMemo, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useReleaseBySlug } from "@/lib/queries";
import { LazyImage } from "@/components/LazyImage";
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
  lyricsOpen,
  onToggleLyrics,
}: {
  track: Track;
  previewOpen: boolean;
  onTogglePreview: () => void;
  lyricsOpen: boolean;
  onToggleLyrics: () => void;
}) => {
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
          <span className="w-16 shrink-0 flex justify-end">
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
          </span>
          <span className="w-20 shrink-0 flex justify-end">
            {hasLyrics && (
              <button
                onClick={onToggleLyrics}
                className="text-[10px] uppercase tracking-[0.24em] text-ivory/55 hover:text-ivory inline-flex items-center gap-1.5"
                aria-expanded={lyricsOpen}
              >
                Lyrics
                {lyricsOpen ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
            )}
          </span>
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
    </li>
  );
};

const ReleasePage = () => {
  const { slug } = useParams();
  const { data, isLoading, isError } = useReleaseBySlug(slug);
  const [openPreviewTrackId, setOpenPreviewTrackId] = useState<string | null>(null);
  const [openLyricsTrackId, setOpenLyricsTrackId] = useState<string | null>(null);
  const [bgReady, setBgReady] = useState(false);

  const coverArt = data?.release?.coverArt ?? null;

  // Reuse the same URL for the blurred background — the browser dedupes the request.
  const featuredBgUrl = useMemo(() => {
    if (!coverArt) return null;
    const sep = coverArt.includes("?") ? "&" : "?";
    return `${coverArt}${sep}w=640`;
  }, [coverArt]);

  useEffect(() => {
    setBgReady(false);
    if (!featuredBgUrl) return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = featuredBgUrl;
    link.setAttribute("fetchpriority", "high");
    document.head.appendChild(link);

    const img = new Image();
    img.decoding = "async";
    img.src = featuredBgUrl;
    const done = () => setBgReady(true);
    img.addEventListener("load", done);
    img.addEventListener("error", done);

    return () => {
      img.removeEventListener("load", done);
      img.removeEventListener("error", done);
      if (link.parentNode) link.parentNode.removeChild(link);
    };
  }, [featuredBgUrl]);

  if (isLoading) return <PageLoading label="Opening release" />;
  if (isError) return <PageError />;
  if (!data) return <Navigate to="/releases" replace />;

  const { release, artist, tracks, related } = data;
  const releaseDate = release.releaseDate ? new Date(release.releaseDate) : null;
  const monthYear = releaseDate && !Number.isNaN(releaseDate.getTime())
    ? releaseDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : "TBC";
  const dateLabel = releaseDate && !Number.isNaN(releaseDate.getTime()) ? releaseDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }) : "Release date TBC";

  return (
    <div>
      <PageTitle title={release.title} />
      {/* Hero + Tracklist (unified blurred-cover background) */}
      <section className="relative overflow-hidden bg-ink text-ivory pt-52 md:pt-60 pb-28">
        {featuredBgUrl && (
          <div
            className={`absolute inset-0 scale-110 bg-cover bg-center transition-opacity duration-300 ${bgReady ? "opacity-100" : "opacity-0"}`}
            style={{
              backgroundImage: `url(${featuredBgUrl})`,
              filter: "blur(50px)",
            }}
            aria-hidden="true"
          />
        )}
        <div className="absolute inset-0 bg-ink/75" aria-hidden="true" />

        <div className="relative container-editorial grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-6">
            <div className="overflow-hidden aspect-square shadow-[var(--shadow-soft)] w-full max-w-[620px] mx-auto lg:mx-0">
              {release.coverArt ? (
                <LazyImage
                  src={release.coverArt}
                  alt={release.title}
                  width={1200}
                  height={1200}
                  displayWidth={960}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  loading="eager"
                  fetchPriority="high"
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-ivory/10 flex items-center justify-center text-ivory/60">Artwork coming soon.</div>
              )}
            </div>
          </div>
          <div className="lg:col-span-6">
            <p className="eyebrow text-gold-soft mb-4">{release.releaseType} · {monthYear}</p>
            <h1 className="display-serif text-4xl md:text-5xl lg:text-6xl mb-6">{release.title}</h1>
            {artist && (
              <Link to={`/artists/${encodeURIComponent(artist.slug)}`} className="font-serif italic text-2xl md:text-3xl text-ivory/82 link-underline">
                {artist.name}
              </Link>
            )}
            <p className="text-sm text-ivory/60 mt-6">{dateLabel}</p>
            {(release.fullDescription || release.shortDescription) && (
              <p className="mt-8 text-sm md:text-base leading-relaxed text-ivory/75 max-w-2xl">
                {release.fullDescription || release.shortDescription}
              </p>
            )}
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

        <div className="relative container-editorial grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-28 mt-28">
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
                    lyricsOpen={openLyricsTrackId === t.id}
                    onToggleLyrics={() =>
                      setOpenLyricsTrackId((curr) => (curr === t.id ? null : t.id))
                    }
                  />
                ))}
              </ol>
            )}
          </div>
          <div className="lg:col-span-5">
            {(() => {
              const activeTrack = tracks.find((t) => t.id === openLyricsTrackId);
              if (!activeTrack || !activeTrack.lyrics) {
                return (
                  <p className="text-ivory/55 italic text-sm">
                    Select “Lyrics” on a track to view them here.
                  </p>
                );
              }
              return (
                <div>
                  <p className="eyebrow text-gold-soft mb-4">Lyrics</p>
                  <h3 className="font-serif text-2xl md:text-3xl mb-6 text-ivory">
                    {activeTrack.trackTitle}
                  </h3>
                  <div className="text-ivory/80 whitespace-pre-line font-serif text-base leading-relaxed">
                    {activeTrack.lyrics}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="bg-ink text-ivory py-28">
          <div className="container-editorial">
            <p className="eyebrow mb-4 text-gold-soft">More from {artist?.name ?? "this artist"}</p>
            <h2 className="display-serif text-5xl md:text-6xl mb-16">Related Releases</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              {related.map((r) => (
                <Link key={r.slug} to={`/releases/${encodeURIComponent(r.slug)}`} className="group block hover-zoom cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory">
                  <div className="aspect-square">
                    {r.coverArt ? (
                      <LazyImage
                        src={r.coverArt}
                        alt={r.title}
                        width={1200}
                        height={1200}
                        displayWidth={480}
                        sizes="(min-width: 768px) 33vw, 50vw"
                        className="object-cover"
                      />
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
