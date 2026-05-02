import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useArtistBySlug } from "@/lib/queries";
import { LazyImage } from "@/components/LazyImage";

import { PageTitle } from "@/components/PageTitle";
import { PageLoading, PageError } from "@/components/UIStates";

const ArtistPage = () => {
  const { slug } = useParams();
  const { data, isLoading, isError } = useArtistBySlug(slug);

  if (isLoading) return <PageLoading label="Opening artist" />;
  if (isError) return <PageError />;
  if (!data) return <Navigate to="/artists" replace />;

  const { artist, discography } = data;
  const heroImage = artist.heroImage2 || artist.heroImage;
  const featured = discography[0];
  return (
    <div>
      <PageTitle title={artist.name} />
      {/* Hero */}
      <section className="relative h-[85vh] min-h-[600px] bg-ink text-ivory overflow-hidden">
        {heroImage ? (
          <LazyImage
            src={heroImage}
            alt={artist.name}
            width={1920}
            height={1280}
            displayWidth={1920}
            sizes="100vw"
            loading="eager"
            fetchPriority="high"
            fill
            className="object-cover opacity-80"
          />
        ) : (
          <div className="absolute inset-0 bg-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/30" />
        <div className="relative z-10 h-full container-editorial flex flex-col justify-end pb-20">
          <p className="eyebrow mb-4 text-gold-soft">{artist.genre}</p>
          <h1 className="display-serif text-7xl md:text-9xl">{artist.name}</h1>
          {artist.shortDescription && (
            <p className="font-serif italic text-2xl md:text-3xl text-ivory/85 mt-6 max-w-2xl">
              {artist.shortDescription}
            </p>
          )}
        </div>
      </section>

      {/* Bio */}
      <section className="bg-ink text-ivory py-20 md:py-28">
        <div className="container-editorial grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4">
          <p className="eyebrow mb-4 text-gold-soft">About</p>
          <div className="gold-rule" />
        </div>
        <div className="lg:col-span-8 space-y-5">
          {artist.fullBio.length === 0 ? (
            <p className="text-base md:text-lg leading-relaxed font-light text-ivory/60">Artist bio coming soon.</p>
          ) : (
            artist.fullBio.map((p, i) => (
              <p key={i} className="text-base md:text-lg leading-relaxed font-light text-ivory/82">{p}</p>
            ))
          )}
        </div>
        </div>
      </section>

      {/* Featured (latest) Release */}
      {featured && (
        <section className="relative overflow-hidden bg-ink py-28 md:py-36 text-ivory">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_38%,hsl(var(--golden-brown)/0.38),transparent_34%),radial-gradient(circle_at_18%_78%,hsl(var(--gold)/0.16),transparent_28%)]" aria-hidden="true" />
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,hsl(var(--ivory)/0.8)_1px,transparent_1px),linear-gradient(0deg,hsl(var(--ivory)/0.8)_1px,transparent_1px)] [background-size:3px_3px]" aria-hidden="true" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_42%,hsl(var(--ink)/0.72)_100%)]" aria-hidden="true" />
          <div className="relative container-editorial">
          <p className="eyebrow text-gold-soft mb-4">Latest Release</p>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-center mt-8">
            <div className="lg:col-span-5 hover-zoom overflow-hidden">
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
                <div className="w-full aspect-square bg-ivory/10 flex items-center justify-center text-ivory/60">Artwork coming soon.</div>
              )}
            </div>
            <div className="lg:col-span-7">
              <h2 className="display-serif text-5xl md:text-6xl mb-4">{featured.title}</h2>
              <p className="text-ivory/64 mb-6">
                {featured.releaseType} · {new Date(featured.releaseDate).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </p>
              <p className="text-lg leading-relaxed mb-8 max-w-xl text-ivory/82">
                {featured.fullDescription || featured.shortDescription}
              </p>
              <Link to={`/releases/${encodeURIComponent(featured.slug)}`} className="inline-flex items-center gap-3 border-b border-ivory/70 pb-2 text-[12px] uppercase tracking-[0.24em] hover:text-gold hover:border-gold transition-colors duration-500">
                Open Release <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          </div>
        </section>
      )}

      {/* Discography */}
      <section className="bg-ink text-ivory py-28 md:py-36">
          <div className="container-editorial">
            <p className="eyebrow mb-4 text-gold-soft">Discography</p>
            <h2 className="display-serif text-5xl md:text-7xl mb-16">Selected Works</h2>
            {discography.length === 0 ? (
              <p className="text-ivory/60">No releases yet.</p>
            ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {discography.map((r) => (
                <Link key={r.slug} to={`/releases/${encodeURIComponent(r.slug)}`} className="group block hover-zoom cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory">
                  <div className="aspect-square">
                    {r.coverArt ? (
                      <LazyImage
                        src={r.coverArt}
                        alt={r.title}
                        width={1200}
                        height={1200}
                        displayWidth={480}
                        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-ivory/10 flex items-center justify-center p-4 text-center text-ivory/60">Artwork coming soon.</div>
                    )}
                  </div>
                  <h3 className="font-serif text-xl mt-4">{r.title}</h3>
                  <p className="text-xs text-ivory/60 mt-1">
                    {r.releaseType} · {new Date(r.releaseDate).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                  </p>
                </Link>
              ))}
            </div>
            )}
          </div>
        </section>

    </div>
  );
};

export default ArtistPage;
