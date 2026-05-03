import { useEffect } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PageTitle, formatPageTitle } from "@/components/PageTitle";
import { PageLoading, PageError } from "@/components/UIStates";
import { LazyImage } from "@/components/LazyImage";
import { useJournalArticle } from "@/lib/queries";
import { ArticleBody, formatJournalDate } from "@/components/JournalArticle";

const setMeta = (selector: string, content: string) => {
  const el = document.head.querySelector<HTMLMetaElement>(selector);
  if (el) el.content = content;
};

const JournalArticlePage = () => {
  const { slug } = useParams();
  const { data, isLoading, isError } = useJournalArticle(slug);

  useEffect(() => {
    if (!data) return;
    const a = data.article;
    const title = a.seoTitle || `${a.title} | WMG`;
    document.title = title;
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[name="twitter:title"]', title);
    const desc = a.seoDescription || a.excerpt || "";
    if (desc) {
      setMeta('meta[name="description"]', desc);
      setMeta('meta[property="og:description"]', desc);
      setMeta('meta[name="twitter:description"]', desc);
    }
    if (a.coverImage) {
      setMeta('meta[property="og:image"]', a.coverImage);
      setMeta('meta[name="twitter:image"]', a.coverImage);
    }
  }, [data]);

  if (isLoading) return <PageLoading label="Opening article" />;
  if (isError) return <PageError />;
  if (!data) return <Navigate to="/journal" replace />;

  const { article: a, blocks, relatedArtists, relatedReleases } = data;
  const heroArtist = relatedArtists[0];
  const heroRelease = relatedReleases[0];

  return (
    <article className="bg-ink text-ivory pb-24">
      <PageTitle title={a.seoTitle || a.title} />

      {/* Header */}
      <header className="container-editorial pt-36 md:pt-44 pb-12 max-w-[960px]">
        <div className="flex items-center justify-between gap-4 mb-10">
          <Link to="/journal" className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-ivory/55 hover:text-gold transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Journal
          </Link>
          {a.category && (
            <span className="inline-block border border-gold/50 text-gold text-[10px] uppercase tracking-[0.28em] px-3 py-1.5">
              {a.category}
            </span>
          )}
        </div>
        <div className="mb-8" />

        <h1 className="display-serif text-5xl md:text-7xl lg:text-8xl leading-[1.02] mb-8 text-ivory">
          {a.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] uppercase tracking-[0.24em] text-ivory/60 mb-8">
          {heroArtist && (
            <Link to={`/artists/${heroArtist.slug}`} className="hover:text-gold transition-colors">
              {heroArtist.name}
            </Link>
          )}
          {heroRelease && (
            <Link to={`/releases/${heroRelease.slug}`} className="hover:text-gold transition-colors">
              {heroRelease.title}
            </Link>
          )}
          {a.album && <span>{a.album}</span>}
          {a.publishedDate && <span>{formatJournalDate(a.publishedDate)}</span>}
          {a.readingTime > 0 && <span>{a.readingTime} min read</span>}
        </div>

        {a.excerpt && (
          <p className="font-serif italic text-2xl md:text-3xl text-ivory/85 leading-snug max-w-3xl">
            {a.excerpt}
          </p>
        )}
      </header>

      {/* Hero image intentionally omitted from article body — cover art is used only on listing/cards. */}

      {/* Body */}
      <div className="container-editorial">
        <ArticleBody blocks={blocks} />
      </div>

      {/* Summary */}
      {a.summary && (
        <div className="container-editorial mt-20">
          <div className="mx-auto max-w-[720px] border border-gold/30 bg-ivory/[0.03] p-8 md:p-10">
            <p className="eyebrow text-gold mb-4">Summary</p>
            <p className="font-serif text-xl md:text-2xl text-ivory/90 leading-snug">{a.summary}</p>
          </div>
        </div>
      )}

      {/* Related */}
      {(relatedArtists.length > 0 || relatedReleases.length > 0) && (
        <div className="container-editorial mt-24">
          <div className="mx-auto max-w-[960px] border-t border-ivory/15 pt-14">
            <p className="eyebrow text-gold-soft mb-8">Related</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {relatedArtists.map((art) => (
                <Link key={art.id} to={`/artists/${art.slug}`} className="group flex gap-5 items-center border border-ivory/12 hover:border-gold/40 transition-colors p-4">
                  <div className="relative h-24 w-24 shrink-0 bg-ivory/5 overflow-hidden">
                    {art.heroImage && <LazyImage src={art.heroImage} alt={art.name} width={300} height={300} displayWidth={200} className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="eyebrow text-ivory/50 mb-2">Artist</p>
                    <h3 className="font-serif text-2xl text-ivory group-hover:text-gold transition-colors">{art.name}</h3>
                  </div>
                  <ArrowRight className="h-4 w-4 text-ivory/40 group-hover:text-gold transition-colors" />
                </Link>
              ))}
              {relatedReleases.map((rel) => (
                <Link key={rel.id} to={`/releases/${rel.slug}`} className="group flex gap-5 items-center border border-ivory/12 hover:border-gold/40 transition-colors p-4">
                  <div className="relative h-24 w-24 shrink-0 bg-ivory/5 overflow-hidden">
                    {rel.coverArt && <LazyImage src={rel.coverArt} alt={rel.title} width={300} height={300} displayWidth={200} className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="eyebrow text-ivory/50 mb-2">{rel.releaseType}</p>
                    <h3 className="font-serif text-2xl text-ivory group-hover:text-gold transition-colors truncate">{rel.title}</h3>
                    <p className="text-sm text-ivory/55 mt-1">{rel.artistName}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-ivory/40 group-hover:text-gold transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

export default JournalArticlePage;
