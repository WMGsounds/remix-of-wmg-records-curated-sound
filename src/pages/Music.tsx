import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { SiSpotify, SiApplemusic } from "react-icons/si";
import type { ComponentType, SVGProps } from "react";
import { Seo } from "@/components/Seo";
import { breadcrumbSchema } from "@/lib/seo";
import { useCatalogue } from "@/lib/queries";
import { InlineSkeleton, PageError } from "@/components/UIStates";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterField, SearchInput } from "@/components/FilterBar";
import { matchesSearch } from "@/lib/search";
import { musicHeroDataUrl } from "@/assets/musicHero";
import { AmazonMusicIcon, YouTubeMusicIcon } from "@/components/ReleaseLinks";
import type { CatalogueTrack } from "@/lib/types";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const sortOptions = ["Artist", "Title (A-Z)", "Title (Z-A)"] as const;

const SERVICES = [
  { key: "spotify", label: "Spotify", Icon: SiSpotify as IconComponent, fill: true },
  { key: "appleMusic", label: "Apple Music", Icon: SiApplemusic as IconComponent, fill: true },
  { key: "amazonMusic", label: "Amazon Music", Icon: AmazonMusicIcon as IconComponent },
  { key: "youtubeMusic", label: "YouTube Music", Icon: YouTubeMusicIcon as IconComponent },
] as const;

const StreamingLinks = ({ track, size = "sm" }: { track: CatalogueTrack; size?: "sm" | "md" }) => {
  const available = SERVICES.filter((s) => Boolean(track.links[s.key]));
  if (available.length === 0) return null;
  return (
    <ul className="flex flex-wrap items-center gap-2">
      {available.map((s) => (
        <li key={s.key}>
          <a
            href={track.links[s.key] as string}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Listen to ${track.title} on ${s.label} (opens in a new tab)`}
            className={`group inline-flex items-center gap-2 border border-ivory/22 text-ivory/70 uppercase tracking-[0.22em] transition-colors hover:border-gold/50 hover:text-gold-soft focus:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
              size === "md" ? "px-4 py-2 text-[11px]" : "px-3 py-1.5 text-[10px]"
            }`}
          >
            <s.Icon
              className="h-4 w-4 text-gold-soft transition-colors duration-300 group-hover:text-gold"
              aria-hidden="true"
              {...(("fill" in s && s.fill) ? { fill: "currentColor" } : {})}
            />
            <span>{s.label}</span>
          </a>
        </li>
      ))}
    </ul>
  );
};

const Lyrics = ({ lyrics }: { lyrics: string }) => {
  const blocks = lyrics.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  if (blocks.length === 0) {
    return <p className="text-sm italic text-ivory/40">Lyrics unavailable.</p>;
  }
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => (
        <p key={i} className="whitespace-pre-line text-left text-[15px] leading-[1.9] text-ivory/75 md:text-base">
          {block}
        </p>
      ))}
    </div>
  );
};

const AppearsOn = ({ track }: { track: CatalogueTrack }) => {
  if (track.appearsOn.length === 0) return null;
  return (
    <div>
      <p className="eyebrow mb-4 text-gold-soft">Appears on</p>
      <ul className="space-y-4">
        {track.appearsOn.map((rel) => (
          <li key={rel.id}>
            <Link
              to={`/releases/${rel.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="group flex items-center gap-4 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
            >
              {rel.coverArt ? (
                <img
                  src={rel.coverArt}
                  alt=""
                  loading="lazy"
                  width={56}
                  height={56}
                  className="h-14 w-14 flex-none object-cover border border-ivory/14"
                />
              ) : (
                <span className="h-14 w-14 flex-none border border-ivory/14 bg-ink/60" aria-hidden="true" />
              )}
              <span>
                <span className="block font-serif text-lg leading-snug text-ivory transition-colors group-hover:text-gold-soft">
                  {rel.title}
                </span>
                {rel.releaseType && (
                  <span className="block text-[10px] uppercase tracking-[0.24em] text-ivory/45">{rel.releaseType}</span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

const TrackRow = ({ track, expanded, onToggle }: { track: CatalogueTrack; expanded: boolean; onToggle: () => void }) => {
  const panelId = `track-panel-${track.id}`;
  const artistName = track.artists.map((a) => a.name).join(", ");

  return (
    <li className="border-b border-ivory/12">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        className="flex cursor-pointer items-center justify-between gap-x-8 gap-y-3 px-1 py-6 transition-colors hover:bg-ivory/[0.03] focus:outline-none focus-visible:ring-1 focus-visible:ring-gold md:py-7"
      >
        <div className="min-w-0">
          <h4 className="font-serif text-xl leading-snug text-ivory md:text-2xl">
            {track.title}
            {track.duration && (
              <span className="ml-3 text-sm font-sans text-ivory/45 md:ml-4 md:text-[15px]">({track.duration})</span>
            )}
          </h4>
          {artistName && <p className="mt-1 text-sm text-ivory/50">{artistName}</p>}
        </div>

        <span
          className="inline-flex flex-none items-center gap-2 self-center text-[10px] uppercase tracking-[0.24em] text-ivory/50"
          aria-hidden="true"
        >
          <span className="hidden sm:inline">{expanded ? "Close" : "View track"}</span>
          <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
        </span>
      </div>


      {expanded && (
        <div id={panelId} className="border-t border-ivory/10 bg-ivory/[0.02] px-1 py-10 md:px-6 md:py-12">
          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            <div className="space-y-10">
              <div>
                <h5 className="display-serif text-3xl md:text-4xl">{track.title}</h5>
                {artistName && <p className="mt-2 text-sm text-ivory/55">{artistName}</p>}
                <div className="mt-5">
                  <StreamingLinks track={track} size="md" />
                </div>
              </div>

              {track.description && (
                <div>
                  <p className="eyebrow mb-4 text-gold-soft">About the track</p>
                  <div className="space-y-4">
                    {track.description
                      .split(/\n\s*\n/)
                      .map((p) => p.trim())
                      .filter(Boolean)
                      .map((p, i) => (
                        <p key={i} className="whitespace-pre-line leading-relaxed text-ivory/70">
                          {p}
                        </p>
                      ))}
                  </div>
                </div>
              )}

              <AppearsOn track={track} />

              {(track.duration || track.isrc) && (
                <div className="border-t border-ivory/12 pt-6">
                  <p className="eyebrow mb-3 text-gold-soft">Track details</p>
                  {track.duration && <p className="text-sm text-ivory/60">Duration · {track.duration}</p>}
                  {track.isrc && <p className="mt-1 text-xs text-ivory/40">ISRC · {track.isrc}</p>}
                </div>
              )}
            </div>

            <div>
              <p className="eyebrow mb-5 text-gold-soft">Lyrics</p>
              <Lyrics lyrics={track.lyrics} />
            </div>
          </div>
        </div>
      )}
    </li>
  );
};

const Music = () => {
  const { data: tracks = [], isLoading, isError } = useCatalogue();
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<(typeof sortOptions)[number]>("Artist");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      tracks.filter((t) =>
        matchesSearch(searchQuery, [t.title, t.artists.map((a) => a.name).join(" "), t.description]),
      ),
    [tracks, searchQuery],
  );

  const groups = useMemo(() => {
    if (sort === "Title (A-Z)" || sort === "Title (Z-A)") {
      const sorted = [...visible].sort((a, b) => a.title.localeCompare(b.title));
      return [
        {
          key: "all",
          name: "",
          displayOrder: 0,
          tracks: sort === "Title (Z-A)" ? sorted.reverse() : sorted,
        },
      ];
    }
    const byArtist = new Map<string, { name: string; displayOrder: number; tracks: CatalogueTrack[] }>();
    visible.forEach((t) => {
      const a = t.artists[0];
      const key = a ? a.slug || a.name : "unattributed";
      const name = a?.name ?? "Other Recordings";
      if (!byArtist.has(key)) byArtist.set(key, { name, displayOrder: a?.displayOrder ?? 9999, tracks: [] });
      byArtist.get(key)!.tracks.push(t);
    });
    return [...byArtist.entries()]
      .map(([key, g]) => ({ key, ...g, tracks: [...g.tracks].sort((x, y) => x.title.localeCompare(y.title)) }))
      .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
  }, [visible, sort]);

  useEffect(() => {
    setExpandedId(null);
  }, [sort, searchQuery]);

  const artistCount = groups.filter((g) => g.key !== "all").length;
  const isFiltered = searchQuery.trim().length > 0;

  if (isError) return <PageError message="Couldn't load the catalogue." />;

  return (
    <div className="bg-ink text-ivory pb-32">
      <Seo
        title="Music"
        description="Explore the Wareham Music Group catalogue. Discover tracks by WMG artists, stream on major platforms, read song stories and explore the full lyrics."
        canonicalPath="/music"
        jsonLd={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Music", path: "/music" },
        ])}
      />

      <section className="relative overflow-hidden bg-ink pt-40 pb-24 md:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_38%,hsl(var(--golden-brown)/0.38),transparent_34%),radial-gradient(circle_at_18%_78%,hsl(var(--gold)/0.16),transparent_28%)]" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,hsl(var(--ivory)/0.8)_1px,transparent_1px),linear-gradient(0deg,hsl(var(--ivory)/0.8)_1px,transparent_1px)] [background-size:3px_3px]" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_42%,hsl(var(--ink)/0.72)_100%)]" aria-hidden="true" />
        <div className="relative container-editorial grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow mb-6 text-gold-soft">Media</p>
            <h1 className="display-serif text-6xl md:text-8xl lg:text-9xl mb-10">Music</h1>
            <p className="max-w-2xl text-lg text-ivory/65">
              Explore the WMG catalogue. Discover every track, the stories behind the songs, where
              they appear and the lyrics from first line to last.
            </p>
          </div>
          {musicHeroDataUrl && (
            <div className="relative hidden min-h-[360px] lg:block">
              <div className="absolute right-0 top-1/2 h-[560px] w-full -translate-y-1/2 overflow-hidden [-webkit-mask-image:linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.08)_14%,rgba(0,0,0,0.42)_26%,black_44%,black_56%,rgba(0,0,0,0.42)_74%,rgba(0,0,0,0.08)_86%,transparent_100%)] [mask-image:linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.08)_14%,rgba(0,0,0,0.42)_26%,black_44%,black_56%,rgba(0,0,0,0.42)_74%,rgba(0,0,0,0.08)_86%,transparent_100%)] [mask-repeat:no-repeat] [mask-size:100%_100%]">
                <div className="h-full w-full [-webkit-mask-image:radial-gradient(ellipse_at_center,black_18%,rgba(0,0,0,0.68)_38%,rgba(0,0,0,0.28)_58%,transparent_78%)] [mask-image:radial-gradient(ellipse_at_center,black_18%,rgba(0,0,0,0.68)_38%,rgba(0,0,0,0.28)_58%,transparent_78%)] [mask-repeat:no-repeat] [mask-size:100%_100%]">
                  <div
                    aria-hidden="true"
                    className="h-full w-full bg-no-repeat opacity-90"
                    style={{
                      backgroundImage: `url(${musicHeroDataUrl})`,
                      backgroundSize: "auto 100%",
                      backgroundPosition: "right 90px center",
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-ink" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gold/35" aria-hidden="true" />
      </section>

      <section className="container-editorial pt-24 pb-4">
        <p className="eyebrow mb-6 text-gold-soft">The Catalogue</p>
        <h2 className="display-serif text-4xl md:text-6xl mb-8">Every song, in one place.</h2>
        <p className="max-w-3xl text-lg leading-relaxed text-ivory/60">
          Browse the complete WMG song catalogue by artist. Open any track to discover its story,
          release history and full lyrics, or listen through your preferred streaming service.
        </p>
      </section>

      <div className="container-editorial pt-16">
        <div className="flex flex-wrap items-end justify-between gap-y-6 mb-6 border-y border-ivory/18 py-6">
          <div className="flex flex-wrap items-end gap-x-8 gap-y-6">
            <FilterField label="Search">
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search tracks..." />
            </FilterField>
          </div>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-6">
            <FilterField label="Sort by">
              <Select value={sort} onValueChange={(v) => setSort(v as (typeof sortOptions)[number])}>
                <SelectTrigger
                  aria-label="Sort tracks"
                  className="w-[180px] bg-transparent border-ivory/24 text-[11px] uppercase tracking-[0.24em] text-ivory rounded-none focus:ring-ivory"
                >
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

        <p className="mb-12 text-[11px] uppercase tracking-[0.24em] text-ivory/45" aria-live="polite">
          {visible.length} {visible.length === 1 ? "track" : "tracks"}
          {artistCount > 1 ? ` across ${artistCount} artists` : ""}
        </p>

        {isLoading ? (
          <InlineSkeleton count={6} />
        ) : visible.length === 0 ? (
          <div className="border border-ivory/14 px-8 py-24 text-center">
            <p className="font-serif text-2xl text-ivory">No tracks found.</p>
            <p className="mt-3 text-ivory/55">Try another title or artist.</p>
            {isFiltered && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-8 inline-flex items-center border border-ivory/24 px-6 py-3 text-[11px] uppercase tracking-[0.24em] text-ivory/80 transition-colors hover:border-gold/45 hover:text-gold-soft focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-20">
            {groups.map((group) => (
              <section key={group.key} aria-label={group.name || "All tracks"}>
                {group.name && (
                  <h3
                    id={`artist-${group.key}`}
                    className="mb-6 border-b border-gold/25 pb-4 text-[12px] uppercase tracking-[0.3em] text-gold-soft"
                  >
                    {group.name}
                  </h3>
                )}
                <ul className="border-t border-ivory/12">
                  {group.tracks.map((track) => (
                    <TrackRow
                      key={track.id}
                      track={track}
                      expanded={expandedId === track.id}
                      onToggle={() => setExpandedId((id) => (id === track.id ? null : track.id))}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Music;
