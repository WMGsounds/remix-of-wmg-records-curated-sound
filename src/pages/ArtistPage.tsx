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
  const gallery = artist.gallery.length > 0 ? artist.gallery : [artist.heroImage];

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[85vh] min-h-[600px] bg-ink text-ivory overflow-hidden">
        <img src={artist.heroImage} alt={artist.name} className="absolute inset-0 h-full w-full object-cover opacity-80" />
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
          {artist.fullBio.map((p, i) => (
            <p key={i} className="text-lg md:text-xl leading-relaxed font-light">{p}</p>
          ))}
        </div>
      </section>

      {/* Signature presentation (genre badge band) */}
      <section className="bg-secondary py-24">
        <div className="container-editorial max-w-4xl">
          <p className="eyebrow mb-4">Signature</p>
          <p className="display-serif text-3xl md:text-4xl italic">{artist.shortDescription}</p>
        </div>
      </section>

      {/* Featured (latest) Release */}
      {featured && (
        <section className="container-editorial py-28 md:py-36">
          <p className="eyebrow mb-4">Latest Release</p>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mt-8">
            <div className="lg:col-span-5 hover-zoom overflow-hidden">
              <img src={featured.coverArt} alt={featured.title} className="w-full aspect-square object-cover" />
            </div>
            <div className="lg:col-span-7">
              <h2 className="display-serif text-5xl md:text-6xl mb-4">{featured.title}</h2>
              <p className="text-muted-foreground mb-6">
                {featured.releaseType} · {new Date(featured.releaseDate).getFullYear()}
              </p>
              <p className="text-lg leading-relaxed mb-8 max-w-xl">
                {featured.fullDescription || featured.shortDescription}
              </p>
              <Link to={`/releases/${featured.slug}`} className="inline-flex items-center gap-3 border-b border-foreground pb-2 text-[12px] uppercase tracking-[0.24em] hover:text-accent hover:border-accent transition-colors duration-500">
                Open Release <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Discography */}
      {discography.length > 0 && (
        <section className="bg-ink text-ivory py-28 md:py-36">
          <div className="container-editorial">
            <p className="eyebrow text-ivory/60 mb-4">Discography</p>
            <h2 className="display-serif text-5xl md:text-7xl mb-16">Selected Works</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {discography.map((r) => (
                <Link key={r.slug} to={`/releases/${r.slug}`} className="group block hover-zoom">
                  <div className="overflow-hidden aspect-square">
                    <img src={r.coverArt} alt={r.title} loading="lazy" className="h-full w-full object-cover" />
                  </div>
                  <h3 className="font-serif text-xl mt-4">{r.title}</h3>
                  <p className="text-xs text-ivory/60 mt-1">
                    {r.releaseType} · {new Date(r.releaseDate).getFullYear()}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Listen */}
      <section className="container-editorial py-28">
        <p className="eyebrow mb-4">Listen</p>
        <h2 className="display-serif text-4xl md:text-6xl mb-10">Wherever you listen.</h2>
        <div className="flex flex-wrap gap-4">
          {["Spotify", "Apple Music", "Bandcamp", "Tidal", "YouTube"].map((p) => (
            <a key={p} href="#" className="border border-foreground px-6 py-3 text-[12px] uppercase tracking-[0.24em] hover:bg-foreground hover:text-background transition-colors duration-500">
              {p}
            </a>
          ))}
        </div>
      </section>

      {/* Gallery */}
      <section className="container-editorial pb-28">
        <p className="eyebrow mb-4">Gallery</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
          {gallery.map((img, i) => (
            <div key={i} className="hover-zoom overflow-hidden aspect-[3/4]">
              <img src={img} alt={`${artist.name} ${i+1}`} loading="lazy" className="h-full w-full object-cover" />
            </div>
          ))}
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
