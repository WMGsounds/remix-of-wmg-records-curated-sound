import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { Seo } from "@/components/Seo";
import { breadcrumbSchema } from "@/lib/seo";
import { useVideos } from "@/lib/queries";
import { InlineSkeleton, PageError } from "@/components/UIStates";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterField, SearchInput } from "@/components/FilterBar";
import { matchesSearch } from "@/lib/search";
import { artistNames, embedUrl, thumbnailUrl, type VideoItem } from "@/lib/videos";
import { londonDateKey, seedFromString, seededShuffle } from "@/lib/galleryOrder";
import { videosHeroDataUrl } from "@/assets/videosHero";

const ALL = "all";
const VIDEO_BATCH_SIZE = 18;
const sortOptions = ["Featured", "Random", "Newest", "Artist", "Title"] as const;


const VideoPlayer = ({
  videos,
  index,
  onClose,
  onNavigate,
}: {
  videos: VideoItem[];
  index: number;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) => {
  const video = videos[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate((index + 1) % videos.length);
      if (e.key === "ArrowLeft") onNavigate((index - 1 + videos.length) % videos.length);
    };
    window.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [index, videos.length, onClose, onNavigate]);

  if (!video) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/95 p-4 md:p-10"
      role="dialog"
      aria-modal="true"
      aria-label={`${video.title} — ${video.videoType}`}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close video"
        className="absolute right-5 top-5 z-10 p-2 text-ivory/70 transition-colors hover:text-gold"
      >
        <X className="h-6 w-6" />
      </button>

      {videos.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous video"
            onClick={(e) => { e.stopPropagation(); onNavigate((index - 1 + videos.length) % videos.length); }}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 p-2 text-ivory/60 transition-colors hover:text-gold md:left-6"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            type="button"
            aria-label="Next video"
            onClick={(e) => { e.stopPropagation(); onNavigate((index + 1) % videos.length); }}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 p-2 text-ivory/60 transition-colors hover:text-gold md:right-6"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}

      <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <div className="aspect-video w-full border border-ivory/14 bg-black">
          <iframe
            key={video.youtubeId}
            src={embedUrl(video.youtubeId)}
            title={`${video.title} — ${video.videoType}`}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <div>
            <p className="font-serif text-2xl text-ivory">{video.title}</p>
            {artistNames(video) && <p className="text-sm text-ivory/60">{artistNames(video)}</p>}
          </div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-gold-soft">{video.videoType}</p>
        </div>
      </div>
    </div>
  );
};

const VideoCard = ({ video, onSelect }: { video: VideoItem; onSelect: () => void }) => (
  <button
    type="button"
    onClick={onSelect}
    className="group block w-full border border-ivory/12 bg-ink/40 text-left transition-colors hover:border-gold/45 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
  >
    <div className="relative aspect-video w-full overflow-hidden bg-ink">
      <img
        src={thumbnailUrl(video.youtubeId)}
        alt={`${video.title}${artistNames(video) ? ` by ${artistNames(video)}` : ""} — ${video.videoType}`}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
      />
      <span className="absolute inset-0 bg-ink/20 transition-colors group-hover:bg-ink/10" aria-hidden="true" />
      <span
        className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gold/70 bg-ink/60 text-gold transition-colors group-hover:bg-gold group-hover:text-ink"
        aria-hidden="true"
      >
        <Play className="ml-0.5 h-5 w-5 fill-current" />
      </span>
    </div>
    <div className="px-5 py-4">
      <p className="font-serif text-xl leading-snug text-ivory">{video.title}</p>
      {artistNames(video) && <p className="mt-1 text-sm text-ivory/60">{artistNames(video)}</p>}
      {video.description && (
        <p className="mt-2 text-sm leading-relaxed text-ivory/50 line-clamp-2">{video.description}</p>
      )}
      <p className="mt-3 text-[10px] uppercase tracking-[0.24em] text-gold-soft">{video.videoType}</p>
    </div>
  </button>
);

const Videos = () => {
  const { data: allVideos = [], isLoading, isError } = useVideos();
  const [searchParams, setSearchParams] = useSearchParams();
  const [type, setType] = useState<string>(ALL);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sort, setSort] = useState<(typeof sortOptions)[number]>("Featured");
  const [playerIndex, setPlayerIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(VIDEO_BATCH_SIZE);
  const [openArtists, setOpenArtists] = useState<Set<string>>(new Set());
  const [expandedArtists, setExpandedArtists] = useState<Set<string>>(new Set());
  // Stable for the whole visit; refreshes on a new London calendar day.
  const [dayKey] = useState(() => londonDateKey());



  const artistOptions = useMemo(() => {
    const map = new Map<string, string>();
    allVideos.forEach((v) => {
      v.artists.forEach((a) => {
        const key = a.slug || a.name;
        if (key && a.name && !map.has(key)) map.set(key, a.name);
      });
    });
    return [...map.entries()]
      .map(([key, name]) => ({ key, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allVideos]);

  const typeOptions = useMemo(
    () => [...new Set(allVideos.map((v) => v.videoType).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [allVideos],
  );

  const artistParam = searchParams.get("artist");
  const artist = artistParam && artistOptions.some((a) => a.key === artistParam) ? artistParam : ALL;

  useEffect(() => {
    setVisibleCount(VIDEO_BATCH_SIZE);
  }, [artist, type, searchQuery, sort]);

  const setArtist = useCallback(
    (value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value === ALL) next.delete("artist");
        else next.set("artist", value);
        return next;
      });
    },
    [setSearchParams],
  );

  const visible = useMemo(() => {
    const list = allVideos.filter((v) => {
      if (artist !== ALL && !v.artists.some((a) => (a.slug || a.name) === artist)) return false;
      if (type !== ALL && v.videoType !== type) return false;
      return matchesSearch(searchQuery, [v.title, artistNames(v), v.description, v.videoType]);
    });
    switch (sort) {
      case "Newest":
        return [...list].sort(
          (a, b) => (b.releaseDate ? Date.parse(b.releaseDate) : 0) - (a.releaseDate ? Date.parse(a.releaseDate) : 0),
        );
      case "Artist":
        return [...list].sort(
          (a, b) => artistNames(a).localeCompare(artistNames(b)) || a.title.localeCompare(b.title),
        );
      case "Title":
        return [...list].sort((a, b) => a.title.localeCompare(b.title));
      case "Random":
        return seededShuffle(list, seedFromString(`${dayKey}|${artist}|${type}`));
      default:
        // Server order: Featured, then Sort Order, then newest, then title.
        return list;
    }
  }, [allVideos, artist, type, searchQuery, sort, dayKey]);

  const displayed = useMemo(() => visible.slice(0, visibleCount), [visible, visibleCount]);

  if (isError) return <PageError message="Couldn't load the videos." />;

  return (
    <div className="bg-ink text-ivory pb-32">
      <Seo
        title="Videos"
        description="Official music videos, lyric videos and official audio from across the Wareham Music Group roster."
        canonicalPath="/videos"
        jsonLd={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Videos", path: "/videos" },
        ])}
      />

      <section className="relative overflow-hidden bg-ink pt-40 pb-24 md:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_38%,hsl(var(--golden-brown)/0.38),transparent_34%),radial-gradient(circle_at_18%_78%,hsl(var(--gold)/0.16),transparent_28%)]" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,hsl(var(--ivory)/0.8)_1px,transparent_1px),linear-gradient(0deg,hsl(var(--ivory)/0.8)_1px,transparent_1px)] [background-size:3px_3px]" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_42%,hsl(var(--ink)/0.72)_100%)]" aria-hidden="true" />
        <div className="relative container-editorial grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow mb-6 text-gold-soft">Media</p>
            <h1 className="display-serif text-6xl md:text-8xl lg:text-9xl mb-10">Videos</h1>
            <p className="max-w-2xl text-lg text-ivory/65">
              Explore official audio, lyric videos and music videos from across the Wareham Music
              Group catalogue.
            </p>
          </div>
          <div className="relative hidden min-h-[360px] lg:block">
            <div className="absolute right-0 top-1/2 h-[560px] w-full -translate-y-1/2 overflow-hidden [-webkit-mask-image:linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.08)_14%,rgba(0,0,0,0.42)_26%,black_44%,black_56%,rgba(0,0,0,0.42)_74%,rgba(0,0,0,0.08)_86%,transparent_100%)] [mask-image:linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.08)_14%,rgba(0,0,0,0.42)_26%,black_44%,black_56%,rgba(0,0,0,0.42)_74%,rgba(0,0,0,0.08)_86%,transparent_100%)] [mask-repeat:no-repeat] [mask-size:100%_100%]">
              <div className="h-full w-full [-webkit-mask-image:radial-gradient(ellipse_at_center,black_18%,rgba(0,0,0,0.68)_38%,rgba(0,0,0,0.28)_58%,transparent_78%)] [mask-image:radial-gradient(ellipse_at_center,black_18%,rgba(0,0,0,0.68)_38%,rgba(0,0,0,0.28)_58%,transparent_78%)] [mask-repeat:no-repeat] [mask-size:100%_100%]">
                <div
                  aria-hidden="true"
                  className="h-full w-full bg-no-repeat opacity-90"
                  style={{
                    backgroundImage: `url(${videosHeroDataUrl})`,
                    backgroundSize: "auto 100%",
                    backgroundPosition: "right 90px center",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-ink" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gold/35" aria-hidden="true" />
      </section>


      <div className="container-editorial pt-16">
        <div className="flex flex-wrap items-end justify-between gap-y-6 mb-16 border-y border-ivory/18 py-6">
          <div className="flex flex-wrap items-end gap-x-8 gap-y-6">
            <FilterField label="Artist">
              <Select value={artist} onValueChange={setArtist}>
                <SelectTrigger className="w-[200px] bg-transparent border-ivory/24 text-[11px] uppercase tracking-[0.24em] text-ivory rounded-none focus:ring-ivory">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-ink text-ivory border-ivory/24">
                  <SelectItem value={ALL} className="text-[11px] uppercase tracking-[0.24em] focus:bg-ivory/10 focus:text-ivory">
                    All Artists
                  </SelectItem>
                  {artistOptions.map((a) => (
                    <SelectItem key={a.key} value={a.key} className="text-[11px] uppercase tracking-[0.24em] focus:bg-ivory/10 focus:text-ivory">
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label="Video Type">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-[220px] bg-transparent border-ivory/24 text-[11px] uppercase tracking-[0.24em] text-ivory rounded-none focus:ring-ivory">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-ink text-ivory border-ivory/24">
                  <SelectItem value={ALL} className="text-[11px] uppercase tracking-[0.24em] focus:bg-ivory/10 focus:text-ivory">
                    All Videos
                  </SelectItem>
                  {typeOptions.map((t) => (
                    <SelectItem key={t} value={t} className="text-[11px] uppercase tracking-[0.24em] focus:bg-ivory/10 focus:text-ivory">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
          </div>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-6">
            <FilterField label="Search">
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search videos" />
            </FilterField>
            <FilterField label="Sort by">
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
            </FilterField>
          </div>
        </div>

        {isLoading ? (
          <InlineSkeleton count={9} />
        ) : visible.length === 0 ? (
          <div className="border border-ivory/14 px-8 py-24 text-center">
            <p className="eyebrow mb-4 text-gold-soft">The WMG Video Archive</p>
            <p className="text-lg text-ivory/65">
              {allVideos.length === 0
                ? "New videos are being catalogued. Please check back soon."
                : "No videos match these filters."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {displayed.map((video, i) => (
                <VideoCard key={video.id} video={video} onSelect={() => setPlayerIndex(i)} />
              ))}
            </div>
            {visible.length > displayed.length && (
              <div className="mt-12 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + VIDEO_BATCH_SIZE)}
                  className="group inline-flex items-center gap-2 border border-ivory/24 bg-ink/40 px-8 py-3 text-[11px] uppercase tracking-[0.24em] text-ivory/80 transition-colors hover:border-gold/45 hover:text-gold-soft focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                >
                  Show more
                  <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {playerIndex !== null && displayed[playerIndex] && (
        <VideoPlayer
          videos={displayed}
          index={playerIndex}
          onClose={() => setPlayerIndex(null)}
          onNavigate={setPlayerIndex}
        />
      )}
    </div>
  );
};

export default Videos;
