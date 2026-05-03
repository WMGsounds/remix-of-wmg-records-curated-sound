import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import hero from "@/assets/hero-cinematic.jpg";
import { ArtistCard, ReleaseCard } from "@/components/Cards";
import { PageTitle } from "@/components/PageTitle";
import { LazyImage } from "@/components/LazyImage";
import { useHomepageData, useJournal } from "@/lib/queries";
import { InlineSkeleton } from "@/components/UIStates";
import { formatJournalDate } from "@/components/JournalArticle";

const Index = () => {
  const { data, isLoading, isError } = useHomepageData();
  const { data: journalArticles = [], isLoading: journalLoading } = useJournal();
  const featured = data?.featuredRelease ?? null;
  const featuredArtists = data?.featuredArtists ?? [];
  const latestReleases = data?.latestReleases ?? [];
  const latestArticles = journalArticles.slice(0, 3);

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
      <PageTitle />
      {/* HERO */}
      <section className="relative h-[92vh] min-h-[640px] w-full overflow-hidden -mt-20 bg-ink text-ivory">
        <img
          src={hero}
          alt="WMG Records"
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
          </h1>
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
        <section className="relative overflow-hidden bg-ink py-16 md:py-20 text-ivory border-t border-b border-gold/30">
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
          <div className="relative container-editorial grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            <div className="lg:col-span-7 order-2 lg:order-1">
              <p className="eyebrow text-gold-soft mb-4">Featured Release</p>
              <div className="gold-rule mb-8" />
              <h2 className="display-serif text-5xl md:text-7xl mb-6">{featured.title}</h2>
              <p className="font-serif italic text-2xl text-ivory/68 mb-6">
                {featured.artistName}
              </p>
              {featured.shortDescription && (
                <p className="text-base font-light leading-relaxed max-w-xl mb-10 text-ivory/70">
                  {featured.shortDescription}
                </p>
              )}
              <Link
                to={`/releases/${encodeURIComponent(featured.slug)}`}
                className="inline-flex items-center gap-3 border-b border-ivory/70 pb-2 text-[12px] uppercase tracking-[0.24em] font-medium hover:text-gold hover:border-gold transition-colors duration-500"
              >
                Explore Release <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="lg:col-span-5 order-1 lg:order-2 hover-zoom overflow-hidden">
              {featured.coverArt ? (
                <LazyImage
                  src={featured.coverArt}
                  alt={featured.title}
                  width={1200}
                  height={1200}
                  displayWidth={640}
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <div className="w-full aspect-square bg-muted flex items-center justify-center text-muted-foreground">Artwork coming soon.</div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ARTIST ROSTER (Featured Artists) */}
      <section className="relative overflow-hidden bg-ink text-ivory py-28 md:py-40">
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
      <section className="relative overflow-hidden bg-ink py-28 md:py-40 text-ivory">
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
            We believe in <span className="italic text-gold">craft</span> over noise — in records that
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
                <Link key={a.slug} to={`/journal/${encodeURIComponent(a.slug)}`} className="group cursor-pointer">
                  {a.category && <p className="eyebrow text-gold-soft mb-3">{a.category}</p>}
                  <h3 className="font-serif text-2xl leading-tight text-ivory group-hover:text-gold transition-colors duration-500">
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
