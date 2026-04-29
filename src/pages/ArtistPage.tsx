import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useArtistBySlug } from "@/lib/queries";
import { NewsletterForm } from "@/components/NewsletterForm";
import { PageLoading, PageError } from "@/components/UIStates";

const ArtistPage = () => {
  const { slug } = useParams();
  const { data, isLoading, isError } = useArtistBySlug(slug);

  if (isLoading) return <PageLoading label="Opening artist" />;
  if (isError) return <PageError />;
  if (!data) return <Navigate to="/artists" replace />;

  const { artist, discography } = data;
  const featured = discography[0];
  return (
    <div>
      {/* Hero */}
      <section className="relative h-[85vh] min-h-[600px] bg-ink text-ivory overflow-hidden">
        {artist.heroImage ? (
          <img src={artist.heroImage} alt={artist.name} className="absolute inset-0 h-full w-full object-cover opacity-80" />
        ) : (
          <div className="absolute inset-0 bg-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/30" />
        <div className="relative z-10 h-full container-editorial flex flex-col justify-end pb-20">
          <p className="eyebrow text-ivory/70 mb-4">{artist.genre}</p>
          <h1 className="display-serif text-7xl md:text-9xl">{artist.name}</h1>
          {artist.shortDescription && (
            <p className="font-serif italic text-2xl md:text-3xl text-ivory/85 mt-6 max-w-2xl">
              {artist.shortDescription}
            </p>
          )}
        </div>
      </section>

      {/* Bio */}
      <section className="container-editorial py-28 md:py-36 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4">
          <p className="eyebrow mb-4">About</p>
          <div className="gold-rule" />
        </div>
        <div className="lg:col-span-8 space-y-6">
          {artist.fullBio.length === 0 ? (
            <p className="text-lg md:text-xl leading-relaxed font-light text-muted-foreground">Artist bio coming soon.</p>
          ) : (
            artist.fullBio.map((p, i) => (
              <p key={i} className="text-lg md:text-xl leading-relaxed font-light">{p}</p>
            ))
          )}
        </div>
      </section>

      {/* Featured (latest) Release */}
      {featured && (
        <section className="container-editorial py-28 md:py-36">
          <p className="eyebrow mb-4">Latest Release</p>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mt-8">
            <div className="lg:col-span-5 hover-zoom overflow-hidden">
              {featured.coverArt ? (
                <img src={featured.coverArt} alt={featured.title} className="w-full aspect-square object-cover" />
              ) : (
                <div className="w-full aspect-square bg-muted flex items-center justify-center text-muted-foreground">Artwork coming soon.</div>
              )}
            </div>
            <div className="lg:col-span-7">
              <h2 className="display-serif text-5xl md:text-6xl mb-4">{featured.title}</h2>
              <p className="text-muted-foreground mb-6">
                {featured.releaseType} · {new Date(featured.releaseDate).getFullYear()}
              </p>
              <p className="text-lg leading-relaxed mb-8 max-w-xl">
                {featured.fullDescription || featured.shortDescription}
              </p>
              <Link to={`/releases/${encodeURIComponent(featured.slug)}`} className="inline-flex items-center gap-3 border-b border-foreground pb-2 text-[12px] uppercase tracking-[0.24em] hover:text-accent hover:border-accent transition-colors duration-500">
                Open Release <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Discography */}
      <section className="bg-ink text-ivory py-28 md:py-36">
          <div className="container-editorial">
            <p className="eyebrow text-ivory/60 mb-4">Discography</p>
            <h2 className="display-serif text-5xl md:text-7xl mb-16">Selected Works</h2>
            {discography.length === 0 ? (
              <p className="text-ivory/60">No releases yet.</p>
            ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {discography.map((r) => (
                <Link key={r.slug} to={`/releases/${encodeURIComponent(r.slug)}`} className="group block hover-zoom cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory">
                  <div className="overflow-hidden aspect-square">
                    {r.coverArt ? (
                      <img src={r.coverArt} alt={r.title} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-ivory/10 flex items-center justify-center p-4 text-center text-ivory/60">Artwork coming soon.</div>
                    )}
                  </div>
                  <h3 className="font-serif text-xl mt-4">{r.title}</h3>
                  <p className="text-xs text-ivory/60 mt-1">
                    {r.releaseType} · {new Date(r.releaseDate).getFullYear()}
                  </p>
                </Link>
              ))}
            </div>
            )}
          </div>
        </section>

      {/* Newsletter */}
      <section className="border-t border-border py-24">
        <div className="container-editorial max-w-2xl text-center">
          <p className="eyebrow mb-4">Stay Close</p>
          <h2 className="display-serif text-4xl md:text-5xl mb-8">First to know.</h2>
          <div className="flex justify-center"><NewsletterForm compact /></div>
        </div>
      </section>
    </div>
  );
};

export default ArtistPage;
