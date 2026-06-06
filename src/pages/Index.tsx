import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag } from "lucide-react";
import hero from "@/assets/hero-cinematic.jpg";
import { ArtistCard, ReleaseCard } from "@/components/Cards";
import { Seo } from "@/components/Seo";
import { organizationSchema, websiteSchema } from "@/lib/seo";
import { LazyImage } from "@/components/LazyImage";
import { useHomepageData, useJournal, useTracks, useStoreItems } from "@/lib/queries";
import { InlineSkeleton } from "@/components/UIStates";
import { formatJournalDate } from "@/components/JournalArticle";
import type { StoreItem } from "@/lib/types";

const Index = () => {
  const { data, isLoading, isError } = useHomepageData();
  const { data: journalArticles = [], isLoading: journalLoading } = useJournal();
  const { data: allTracks = [] } = useTracks();
  const { data: storeItems = [] } = useStoreItems();
  const featured = data?.featuredRelease ?? null;
  const featuredArtists = data?.featuredArtists ?? [];
  const latestReleases = data?.latestReleases ?? [];
  const latestArticles = journalArticles.slice(0, 3);

  const featuredTracks = useMemo(() => {
    if (!featured) return [];
    return allTracks
      .filter((t) => t.releaseId === featured.id)
      .sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));
  }, [allTracks, featured]);
  const TRACK_PREVIEW_COUNT = 8;
  const [tracksExpanded, setTracksExpanded] = useState(false);

  const featuredStoreCta = useMemo<
    | { kind: "available"; href: string }
    | { kind: "coming" }
    | { kind: "sold" }
    | { kind: "pending" }
    | null
  >(() => {
    if (!featured) return null;
    const matches = storeItems.filter(
      (s: StoreItem) =>
        s.availability !== "Hidden" &&
        s.release &&
        (s.release.id === featured.id || s.release.slug === featured.slug),
    );
    if (matches.length === 0) return null;
    const live = matches.find((s) => s.availability === "Available Now" && s.purchaseLink);
    if (live) return { kind: "available", href: live.purchaseLink! };
    if (matches.find((s) => s.availability === "Available Now")) return { kind: "pending" };
    if (matches.find((s) => s.availability === "Coming Soon")) return { kind: "coming" };
    if (matches.find((s) => s.availability === "Sold Out")) return { kind: "sold" };
    return null;
  }, [storeItems, featured]);

  // Reuse the same URL for the blurred background — the browser dedupes the request.
  const featuredBgUrl = useMemo(() => {
    if (!featured?.coverArt) return null;
    const sep = featured.coverArt.includes("?") ? "&" : "?";
    return `${featured.coverArt}${sep}w=640`;
  }, [featured?.coverArt]);

  // Preload at high priority the moment the URL is known, and only reveal
  // the blurred layer once bytes are in cache so there's no half-paint flash.
  const [bgReady, setBgReady] = useState(false);
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

  return (
    <div className="pt-20">
      <Seo canonicalPath="/" jsonLd={[organizationSchema(), websiteSchema()]} />
      {/* HERO */}
      <section className="relative h-[92vh] min-h-[640px] w-full overflow-hidden -mt-20 bg-ink text-ivory">
        <img
          src={hero}
          alt="WMG"
          loading="eager"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/20 to-ink/80" />
        <div className="relative z-10 h-full container-editorial flex flex-col justify-end pb-20 md:pb-28">
          <p className="eyebrow mb-6 text-gold-soft animate-fade-in">Wareham Music Group · Est. London</p>
          <h1 className="display-serif text-[15vw] md:text-[10vw] lg:text-[9vw] leading-none animate-fade-up">
            WMG <span className="italic text-gold">Sounds</span>
            <span className="sr-only"> — Independent Record Label</span>
          </h1>
          <p className="mt-4 text-sm md:text-base uppercase tracking-[0.28em] text-ivory/75 animate-fade-up">
            Independent Record Label
          </p>
          <p className="mt-8 max-w-xl text-lg md:text-xl font-light text-ivory/85 animate-fade-up">
            A modern independent label curating artist worlds and timeless sound.
          </p>
          <div className="mt-10 flex flex-wrap gap-4 animate-fade-up">
            <Link
              to="/artists"
              className="inline-flex items-center gap-3 bg-ivory text-ink px-8 py-4 text-[12px] uppercase tracking-[0.24em] font-medium hover:bg-gold transition-colors duration-500"
            >
              Explore Artists <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/releases"
              className="inline-flex items-center gap-3 border border-ivory/60 text-ivory px-8 py-4 text-[12px] uppercase tracking-[0.24em] font-medium hover:bg-ivory hover:text-ink transition-colors duration-500"
            >
              View Releases
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED RELEASE */}
      {featured && (
        <section className="relative overflow-hidden bg-ink pt-16 pb-10 md:pt-20 md:pb-14 text-ivory border-t border-b border-gold/30">
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
          <div className="relative container-editorial grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-12 lg:items-stretch [container-type:inline-size]">
            <div
              className={`lg:col-span-5 order-2 lg:order-1 flex flex-col min-h-0 ${
                tracksExpanded ? "" : "lg:h-[calc(58.333cqw_-_1.25rem)] lg:max-h-[calc(58.333cqw_-_1.25rem)]"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <p className="eyebrow text-gold-soft">Featured Release</p>
                {featuredStoreCta?.kind === "available" && (
                  <a
                    href={featuredStoreCta.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border border-gold bg-gold/10 px-5 py-2.5 text-[11px] uppercase tracking-[0.24em] text-gold hover:bg-gold hover:text-ink transition-colors duration-300"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Available to purchase in Store
                  </a>
                )}
                {featuredStoreCta?.kind === "coming" && (
                  <span className="inline-flex items-center gap-2 border border-ivory/15 px-5 py-2.5 text-[11px] uppercase tracking-[0.24em] text-ivory/55">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Coming Soon in Store
                  </span>
                )}
                {featuredStoreCta?.kind === "sold" && (
                  <span className="inline-flex items-center gap-2 border border-ivory/15 px-5 py-2.5 text-[11px] uppercase tracking-[0.24em] text-ivory/55">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Sold Out
                  </span>
                )}
                {featuredStoreCta?.kind === "pending" && (
                  <span className="inline-flex items-center gap-2 border border-ivory/15 px-5 py-2.5 text-[11px] uppercase tracking-[0.24em] text-ivory/55">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Store link coming soon
                  </span>
                )}
              </div>
              <div className="gold-rule mb-4" />
              <p className="text-[11px] uppercase tracking-[0.24em] text-ivory/55 mb-6">
                Available on all major streaming platforms
              </p>
              <h2 className="display-serif text-5xl md:text-7xl mb-6">{featured.title}</h2>
              <p className="font-serif italic text-2xl text-ivory/68 mb-6">
                {featured.artistName}
              </p>
              {featured.shortDescription && (
                <p className="text-base font-light leading-relaxed max-w-xl mb-8 text-ivory/70">
                  {featured.shortDescription}
                </p>
              )}
              {featuredTracks.length > 0 && (
                <div className="mb-8 max-w-xl flex-1 min-h-0 flex flex-col">
                  <p className="eyebrow text-gold-soft mb-3">Track list</p>
                  <ol className={`space-y-1.5 text-sm text-ivory/75 ${tracksExpanded ? "" : "flex-1 min-h-0 overflow-hidden"}`}>
                    {featuredTracks.map((t, i) => (
                      <li key={t.id} className="flex items-baseline gap-3">
                        <span className="w-6 shrink-0 tabular-nums text-[11px] text-ivory/45">
                          {String(t.trackNumber || i + 1).padStart(2, "0")}
                        </span>
                        <span className="leading-snug font-serif text-base">{t.trackTitle}</span>
                      </li>
                    ))}
                  </ol>
                  <button
                    type="button"
                    onClick={() => setTracksExpanded((v) => !v)}
                    className="mt-3 self-start inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.24em] text-gold/80 transition-colors hover:text-gold"
                  >
                    <span>{tracksExpanded ? "Show less" : "View all"}</span>
                    <span aria-hidden>{tracksExpanded ? "▴" : "▾"}</span>
                  </button>
                </div>
              )}
              <div className="mt-auto pt-2 shrink-0">
                <Link
                  to={`/releases/${encodeURIComponent(featured.slug)}`}
                  className="inline-flex items-center gap-3 border-b border-ivory/70 pb-2 text-[12px] uppercase tracking-[0.24em] font-medium hover:text-gold hover:border-gold transition-colors duration-500"
                >
                  Explore Release <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="lg:col-span-7 order-1 lg:order-2 hover-zoom overflow-hidden self-start">
              {featured.coverArt ? (
                <LazyImage
                  src={featured.coverArt}
                  alt={featured.title}
                  width={1200}
                  height={1200}
                  displayWidth={640}
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover aspect-square w-full"
                />
              ) : (
                <div className="w-full aspect-square bg-muted flex items-center justify-center text-muted-foreground">Artwork coming soon.</div>
              )}
            </div>
          </div>

        </section>
      )}

      {/* ARTIST ROSTER (Featured Artists) */}
      <section className="relative overflow-hidden bg-ink text-ivory pt-12 pb-8 md:pt-20 md:pb-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,hsl(var(--golden-brown)/0.24),transparent_28%),radial-gradient(circle_at_30%_36%,hsl(var(--gold)/0.10),transparent_30%)]" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(90deg,hsl(var(--ivory)/0.72)_1px,transparent_1px),linear-gradient(0deg,hsl(var(--ivory)/0.72)_1px,transparent_1px)] [background-size:3px_3px]" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_38%,hsl(var(--ink)/0.72)_100%)]" aria-hidden="true" />
        <div className="relative container-editorial">
          <div className="flex items-end justify-between mb-16">
            <div>
              <p className="eyebrow mb-4 text-gold-soft">The Roster</p>
              <h2 className="display-serif text-5xl md:text-7xl">Featured Artists</h2>
            </div>
            <Link to="/artists" className="hidden md:inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.24em] link-underline">
              All Artists <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-ivory/10" />
                  <div className="h-4 bg-ivory/10 mt-5 w-3/4" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <p className="text-ivory/60">Couldn't load artists.</p>
          ) : featuredArtists.length === 0 ? (
            <p className="text-ivory/60">No featured artists yet.</p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
              {featuredArtists.map((a) => (
                <Link
                  key={a.slug}
                  to={`/artists/${encodeURIComponent(a.slug)}`}
                  className="group block hover-zoom cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory"
                  aria-label={`View ${a.name}`}
                >
                  <div className="relative bg-secondary aspect-[3/4]">
                    {a.heroImage ? (
                      <LazyImage
                        src={a.heroImage}
                        alt={a.name}
                        width={900}
                        height={1200}
                        displayWidth={480}
                        sizes="(min-width: 1024px) 25vw, 50vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center p-6 text-center text-ivory/60">Image coming soon.</div>
                    )}
                  </div>
                  <div className="pt-5">
                    <h3 className="font-serif text-2xl">{a.name}</h3>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-ivory/60 mt-2">{a.genre}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* LATEST RELEASES */}
      <section className="relative overflow-hidden bg-ink pt-8 pb-14 md:pt-12 md:pb-28 text-ivory">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_38%,hsl(var(--golden-brown)/0.38),transparent_34%),radial-gradient(circle_at_18%_78%,hsl(var(--gold)/0.16),transparent_28%)]" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,hsl(var(--ivory)/0.8)_1px,transparent_1px),linear-gradient(0deg,hsl(var(--ivory)/0.8)_1px,transparent_1px)] [background-size:3px_3px]" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_42%,hsl(var(--ink)/0.72)_100%)]" aria-hidden="true" />
        <div className="relative container-editorial">
        <div className="flex items-end justify-between mb-16">
          <div>
            <p className="eyebrow text-gold-soft mb-4">New & Recent</p>
            <h2 className="display-serif text-5xl md:text-7xl">Latest Releases</h2>
          </div>
          <Link to="/releases" className="hidden md:inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.24em] link-underline">
            All Releases <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {isLoading ? (
          <InlineSkeleton count={4} />
        ) : isError ? (
          <p className="text-muted-foreground">Couldn't load releases.</p>
        ) : latestReleases.length === 0 ? (
          <p className="text-muted-foreground">No releases on the homepage yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10">
            {latestReleases.map((r) => <ReleaseCard key={r.slug} release={r} hideMetaOnMobile />)}
          </div>
        )}
        </div>
      </section>

      {/* LABEL STATEMENT */}
      <section className="relative overflow-hidden bg-ink py-16 md:py-20 text-ivory">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_30%,hsl(var(--golden-brown)/0.32),transparent_32%),radial-gradient(circle_at_80%_70%,hsl(var(--gold)/0.14),transparent_30%)]" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(90deg,hsl(var(--ivory)/0.72)_1px,transparent_1px),linear-gradient(0deg,hsl(var(--ivory)/0.72)_1px,transparent_1px)] [background-size:3px_3px]" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,hsl(var(--ink)/0.72)_100%)]" aria-hidden="true" />
        <div className="relative container-editorial max-w-4xl">
          <p className="eyebrow text-gold-soft mb-4">Our Statement</p>
          <div className="gold-rule mb-8" />
          <p className="display-serif text-2xl md:text-3xl leading-[1.2] text-ivory">
            We believe in <span className="italic text-gold">craft</span> over noise in records that
            reward attention, and in artists whose worlds are built to last. WMG is a home for music
            made with intent.
          </p>
        </div>
      </section>

      {/* JOURNAL */}
      <section className="bg-ink py-16 md:py-20 text-ivory">
        <div className="container-editorial">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="eyebrow text-gold-soft mb-3">The Journal</p>
              <h2 className="display-serif text-4xl md:text-5xl">Notes & Stories</h2>
            </div>
            <Link to="/journal" className="hidden md:inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.24em] link-underline">
              All Articles <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {journalLoading ? (
            <InlineSkeleton count={3} />
          ) : latestArticles.length === 0 ? (
            <p className="text-ivory/60">No articles yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {latestArticles.map((a) => (
                <Link key={a.slug} to={`/journal/${encodeURIComponent(a.slug)}`} className="group cursor-pointer block">
                  {a.category && <p className="eyebrow text-gold-soft mb-3">{a.category}</p>}
                  <div className="relative bg-ink aspect-[4/3] mb-5 overflow-hidden flex items-center justify-center">
                    {a.coverImage ? (
                      <>
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 scale-110 bg-cover bg-center"
                          style={{
                            backgroundImage: `url(${a.coverImage}${a.coverImage.includes("?") ? "&" : "?"}w=640)`,
                            filter: "blur(50px)",
                          }}
                        />
                        <div className="absolute inset-0 bg-ink/75" aria-hidden="true" />
                        <img
                          src={`${a.coverImage}${a.coverImage.includes("?") ? "&" : "?"}w=960`}
                          alt={a.title}
                          loading="lazy"
                          decoding="async"
                          className="relative z-10 max-w-full max-h-full w-auto h-auto object-contain transition-transform duration-700 group-hover:scale-105"
                        />
                      </>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-ivory/70 text-sm">No image</div>
                    )}
                  </div>
                  <h3 className="font-serif text-2xl leading-tight text-ivory group-hover:text-gold transition-colors duration-500 line-clamp-2 max-w-[85%]">
                    {a.title}
                  </h3>
                  {a.publishedDate && (
                    <p className="text-sm text-ivory/60 mt-4">{formatJournalDate(a.publishedDate)}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
};

export default Index;
