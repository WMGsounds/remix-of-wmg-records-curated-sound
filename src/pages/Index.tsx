import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";
import hero from "@/assets/hero-cinematic.jpg";
import { ArtistCard, ReleaseCard } from "@/components/Cards";
import { NewsletterForm } from "@/components/NewsletterForm";
import { useHomepageData } from "@/lib/queries";
import { InlineSkeleton } from "@/components/UIStates";

const Index = () => {
  const { data, isLoading, isError } = useHomepageData();
  const featured = data?.featuredRelease ?? null;
  const featuredArtists = data?.featuredArtists ?? [];
  const latestReleases = data?.latestReleases ?? [];

  return (
    <div className="pt-20">
      {/* HERO */}
      <section className="relative h-[92vh] min-h-[640px] w-full overflow-hidden -mt-20 bg-ink text-ivory">
        <img
          src={hero}
          alt="WMG Records"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/20 to-ink/80" />
        <div className="relative z-10 h-full container-editorial flex flex-col justify-end pb-20 md:pb-28">
          <p className="eyebrow text-ivory/70 mb-6 animate-fade-in">Wareham Music Group · Est. London</p>
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
        <section className="container-editorial py-28 md:py-40">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            <div className="lg:col-span-7 order-2 lg:order-1">
              <p className="eyebrow mb-4">Featured Release</p>
              <div className="gold-rule mb-8" />
              <h2 className="display-serif text-5xl md:text-7xl mb-6">{featured.title}</h2>
              <p className="font-serif italic text-2xl text-muted-foreground mb-8">
                {featured.artistName}
              </p>
              <p className="text-lg leading-relaxed max-w-xl mb-10 text-foreground/85">
                {featured.fullDescription || featured.shortDescription}
              </p>
              <Link
                to={`/releases/${featured.slug}`}
                className="inline-flex items-center gap-3 border-b border-foreground pb-2 text-[12px] uppercase tracking-[0.24em] font-medium hover:text-accent hover:border-accent transition-colors duration-500"
              >
                Explore Release <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="lg:col-span-5 order-1 lg:order-2 hover-zoom overflow-hidden">
              <img src={featured.coverArt} alt={featured.title} loading="lazy" className="w-full aspect-square object-cover" />
            </div>
          </div>
        </section>
      )}

      {/* ARTIST ROSTER (Featured Artists) */}
      <section className="bg-ink text-ivory py-28 md:py-40">
        <div className="container-editorial">
          <div className="flex items-end justify-between mb-16">
            <div>
              <p className="eyebrow text-ivory/60 mb-4">The Roster</p>
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
                <Link key={a.slug} to={`/artists/${a.slug}`} className="group block hover-zoom">
                  <div className="relative overflow-hidden bg-secondary aspect-[3/4]">
                    <img src={a.heroImage} alt={a.name} loading="lazy" className="h-full w-full object-cover" />
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
      <section className="container-editorial py-28 md:py-40">
        <div className="flex items-end justify-between mb-16">
          <div>
            <p className="eyebrow mb-4">New & Recent</p>
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
            {latestReleases.map((r) => <ReleaseCard key={r.slug} release={r} />)}
          </div>
        )}
      </section>

      {/* LABEL STATEMENT */}
      <section className="bg-secondary py-28 md:py-40">
        <div className="container-editorial max-w-4xl">
          <p className="eyebrow mb-6">Our Statement</p>
          <p className="display-serif text-3xl md:text-5xl leading-[1.15]">
            We believe in <span className="italic text-gold">craft</span> over noise — in records that
            reward attention, and in artists whose worlds are built to last. WMG is a home for music
            made with intent.
          </p>
        </div>
      </section>

      {/* LISTENING / VIDEO */}
      <section className="container-editorial py-28 md:py-40">
        <p className="eyebrow mb-4">Watch & Listen</p>
        <h2 className="display-serif text-5xl md:text-7xl mb-12">In Session</h2>
        <div className="relative aspect-video bg-ink overflow-hidden group cursor-pointer">
          <img
            src={hero}
            alt="WMG Sessions"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-60 group-hover:opacity-50 transition-opacity duration-700"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-20 w-20 md:h-24 md:w-24 border border-ivory/80 rounded-full flex items-center justify-center text-ivory group-hover:bg-ivory group-hover:text-ink transition-colors duration-500">
              <Play className="h-7 w-7 ml-1" fill="currentColor" />
            </div>
          </div>
          <div className="absolute bottom-8 left-8 text-ivory">
            <p className="font-serif text-2xl md:text-3xl">Marcus Vale — Live at Studio Aurum</p>
            <p className="text-sm text-ivory/70 mt-1">A WMG Session · 12 min</p>
          </div>
        </div>
      </section>

      {/* JOURNAL */}
      <section className="bg-secondary py-28 md:py-40">
        <div className="container-editorial">
          <div className="flex items-end justify-between mb-16">
            <div>
              <p className="eyebrow mb-4">The Journal</p>
              <h2 className="display-serif text-5xl md:text-7xl">Notes & Stories</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { kicker: "Essay", title: "On building artist worlds in a streaming age", date: "April 2026" },
              { kicker: "In the Studio", title: "Recording 'After the Room' to tape, in one weekend", date: "March 2026" },
              { kicker: "Conversation", title: "Iris Naoko on silence, breath, and the cello", date: "February 2026" },
            ].map((p) => (
              <article key={p.title} className="group cursor-pointer">
                <p className="eyebrow mb-4">{p.kicker}</p>
                <h3 className="font-serif text-3xl leading-tight group-hover:text-accent transition-colors duration-500">
                  {p.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-6">{p.date}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="container-editorial py-28 md:py-40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <p className="eyebrow mb-4">Stay Close</p>
            <h2 className="display-serif text-5xl md:text-7xl">Join the List</h2>
          </div>
          <div>
            <p className="text-lg text-foreground/80 max-w-md mb-8">
              New releases. Limited editions. First access. Sent rarely, only when it matters.
            </p>
            <NewsletterForm />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
