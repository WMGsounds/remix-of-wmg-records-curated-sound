import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { Seo } from "@/components/Seo";
import { staticSeo } from "@/lib/seoConfig";

import { useVideos } from "@/lib/queries";
import { InlineSkeleton, PageError } from "@/components/UIStates";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterField, SearchInput } from "@/components/FilterBar";
import { matchesSearch } from "@/lib/search";
import {
  artistNames,
  embedUrl,
  thumbnailUrl,
  watchUrl,
  type VideoItem,
} from "@/lib/videos";
import { itemList, videoObject } from "@/lib/schema";
import { londonDateKey, seedFromString, seededShuffle } from "@/lib/galleryOrder";
import { videosHeroDataUrl } from "@/assets/videosHero";

const ALL = "all";
const VIDEO_BATCH_SIZE = 18;
const ARTIST_VIDEO_LIMIT = 12;
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

/**
 * Click-to-load facade: the card is a real anchor to the YouTube watch URL, so
 * the pre-rendered HTML always contains a crawlable, playable link. JavaScript
 * intercepts the click to open the in-page player instead.
 */
const VideoCard = ({ video, onSelect }: { video: VideoItem; onSelect: () => void }) => (
  <a
    href={watchUrl(video.youtubeId)}
    rel="noopener"
    onClick={(e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      onSelect();
    }}
    className="group block w-full border border-ivory/12 bg-ink/40 text-left transition-colors hover:border-gold/45 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
  >
    <div className="relative aspect-video w-full overflow-hidden bg-ink">
      <img
        src={thumbnailUrl(video.youtubeId)}
        alt={`${video.title}${artistNames(video) ? ` by ${artistNames(video)}` : ""} — ${video.videoType}`}
        loading="lazy"
        width={480}
        height={360}
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
      <h3 className="font-serif text-xl leading-snug text-ivory">
        {video.title}
        {video.duration ? (
          <span className="ml-3 align-middle text-sm text-ivory/45">({video.duration})</span>
        ) : null}
      </h3>
      {artistNames(video) && <p className="mt-1 text-sm text-ivory/60">{artistNames(video)}</p>}
      {video.description && (
        <p className="mt-2 text-sm leading-relaxed text-ivory/50 line-clamp-2">{video.description}</p>
      )}
      <p className="mt-3 text-[10px] uppercase tracking-[0.24em] text-gold-soft">{video.videoType}</p>
    </div>
  </a>
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

  const groupedByArtist = sort === "Artist";

  // Artist groups (A–Z) preserving the existing within-artist ordering of `visible`.
  const artistGroups = useMemo(() => {
    if (!groupedByArtist) return [];
    const map = new Map<string, { key: string; name: string; videos: VideoItem[] }>();
    visible.forEach((v) => {
      const entries = v.artists.length ? v.artists : [{ name: "Other", slug: "other" }];
      entries.forEach((a) => {
        const key = a.slug || a.name || "other";
        const name = a.name || "Other";
        if (!map.has(key)) map.set(key, { key, name, videos: [] });
        const group = map.get(key)!;
        if (!group.videos.some((existing) => existing.id === v.id)) group.videos.push(v);
      });
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [visible, groupedByArtist]);

  // Flat list backing the player so prev/next still works across open sections.
  const groupedPlayerList = useMemo(
    () =>
      artistGroups.flatMap((g) =>
        openArtists.has(g.key)
          ? expandedArtists.has(g.key)
            ? g.videos
            : g.videos.slice(0, ARTIST_VIDEO_LIMIT)
          : [],
      ),
    [artistGroups, openArtists, expandedArtists],
  );

  /* Heading for the flat grid, derived from the video types actually present
     in the data (never a hardcoded list). Selecting a type in the filter bar
     narrows the heading so it describes exactly what is shown. */
  const pluralType = (t: string) => (/(video)$/i.test(t) ? `${t}s` : t);
  const gridHeading = useMemo(() => {
    if (type !== ALL) return pluralType(type);
    const labels = typeOptions.map(pluralType);
    if (labels.length === 0) return "Videos";
    if (labels.length === 1) return labels[0];
    return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
  }, [type, typeOptions]);

  /* The default view is a single flat grid (users segment by Video Type with
     the filter bar). One descriptive H2 introduces it; each card title is an H3
     beneath, so the outline stays H1 > H2 > H3 with no skipped levels. */
  const playerList = groupedByArtist ? groupedPlayerList : displayed;


  /* VideoObject requires only name, thumbnailUrl and uploadDate. duration is
     recommended: emit it when present, warn when absent, never suppress markup.
     contentUrl is deliberately omitted — we have no underlying media file for
     YouTube-hosted video, and a watch page URL is not a contentUrl. */
  const videoSchemas = useMemo(() => {
    const eligible: Record<string, unknown>[] = [];
    const skipped: string[] = [];
    const noDuration: string[] = [];
    visible.forEach((v) => {
      const thumb = v.youtubeId ? thumbnailUrl(v.youtubeId) : "";
      if (!v.title || !thumb || !v.releaseDate) {
        const missing = [!v.title && "name", !thumb && "thumbnailUrl", !v.releaseDate && "uploadDate"]
          .filter(Boolean)
          .join(", ");
        skipped.push(`${v.title || v.id} (no ${missing})`);
        return;
      }
      if (!v.duration) noDuration.push(v.title);
      eligible.push(
        videoObject({
          name: v.title,
          description: v.description || undefined,
          thumbnailUrl: thumb,
          uploadDate: v.releaseDate,
          embedUrl: `https://www.youtube.com/embed/${v.youtubeId}`,
          duration: v.duration || undefined,
          artistName: v.artists[0]?.name,
          artistSlug: v.artists[0]?.slug,
        }),
      );
    });
    if (skipped.length) {
      console.warn(
        `[videos] VideoObject omitted for ${skipped.length} video(s) missing required properties: ${skipped.join("; ")}`,
      );
    }
    if (noDuration.length) {
      console.warn(
        `[videos] VideoObject emitted without duration (recommended) for ${noDuration.length} video(s): ${noDuration.join("; ")}`,
      );
    }
    return eligible;
  }, [visible]);


  /* Per-video pages deliberately do not exist, so the ItemList identifies each
     video by its YouTube watch URL. The default view is deliberately unordered,
     so the markup says so; positions follow the rendered order. */
  const videosItemList = useMemo(
    () =>
      visible.length
        ? itemList({
            path: "/videos",
            name: type !== ALL ? `WMG ${pluralType(type)}` : "WMG Videos",
            order: "Unordered",
            items: visible.map((v) => ({ name: v.title, path: watchUrl(v.youtubeId) })),
          })
        : null,
    [visible],
  );


  const toggleArtist = (key: string) =>
    setOpenArtists((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        setExpandedArtists((exp) => {
          const e = new Set(exp);
          e.delete(key);
          return e;
        });
      } else {
        next.add(key);
      }
      return next;
    });

  if (isError) return <PageError message="Couldn't load the videos." />;

  return (
    <div className="bg-ink text-ivory pb-32">
      <Seo
        {...staticSeo("videos")}
        jsonLd={[...(videosItemList ? [videosItemList] : []), ...videoSchemas]}
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
        ) : groupedByArtist ? (
          <div className="space-y-4">
            {artistGroups.map((group) => {
              const open = openArtists.has(group.key);
              const showAll = expandedArtists.has(group.key);
              const shown = showAll ? group.videos : group.videos.slice(0, ARTIST_VIDEO_LIMIT);
              const panelId = `videos-artist-panel-${group.key}`;
              return (
                <section key={group.key} aria-label={group.name}>
                  <h2 className="sr-only">{group.name}</h2>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => toggleArtist(group.key)}
                    className="group flex w-full items-center justify-between gap-6 border-b border-gold/25 py-6 text-left transition-colors hover:border-gold/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                  >
                    <span className="min-w-0">
                      <span className="block break-words text-[13px] uppercase tracking-[0.3em] text-gold-soft transition-colors group-hover:text-gold md:text-[14px]">
                        {group.name}
                      </span>
                      <span className="mt-2 block text-[11px] uppercase tracking-[0.24em] text-ivory/40">
                        {group.videos.length} {group.videos.length === 1 ? "video" : "videos"}
                      </span>
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className={`h-4 w-4 flex-none text-ivory/50 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                    />
                  </button>


                  <div id={panelId} hidden={!open} className="overflow-hidden animate-in fade-in-0 duration-300">
                    <div className="grid grid-cols-1 gap-8 pt-8 sm:grid-cols-2 lg:grid-cols-3">
                      {shown.map((video) => (
                        <VideoCard
                          key={`${group.key}-${video.id}`}
                          video={video}
                          onSelect={() =>
                            setPlayerIndex(groupedPlayerList.findIndex((v) => v.id === video.id))
                          }
                        />
                      ))}
                    </div>
                    {group.videos.length > ARTIST_VIDEO_LIMIT && (
                      <div className="mt-10 flex justify-center">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedArtists((prev) => {
                              const next = new Set(prev);
                              next.has(group.key) ? next.delete(group.key) : next.add(group.key);
                              return next;
                            })
                          }
                          className="group inline-flex items-center gap-2 border border-ivory/24 bg-ink/40 px-8 py-3 text-[11px] uppercase tracking-[0.24em] text-ivory/80 transition-colors hover:border-gold/45 hover:text-gold-soft focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                        >
                          {showAll ? "Show less" : "Show more"}
                          <ChevronDown
                            className={`h-4 w-4 transition-transform group-hover:translate-y-0.5 ${showAll ? "rotate-180" : ""}`}
                          />
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <>
            <section aria-labelledby="videos-all">
              <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4 border-b border-gold/25 pb-4">
                <h2 id="videos-all" className="font-serif text-2xl text-ivory md:text-3xl">
                  {gridHeading}
                </h2>
                <span className="text-[11px] uppercase tracking-[0.24em] text-ivory/40">
                  {visible.length} {visible.length === 1 ? "video" : "videos"}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {displayed.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onSelect={() => setPlayerIndex(displayed.findIndex((v) => v.id === video.id))}
                  />
                ))}
              </div>
            </section>

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

      {playerIndex !== null && playerIndex >= 0 && playerList[playerIndex] && (
        <VideoPlayer
          videos={playerList}
          index={playerIndex}
          onClose={() => setPlayerIndex(null)}
          onNavigate={setPlayerIndex}
        />
      )}
    </div>
  );
};

export default Videos;
