import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageTitle } from "@/components/PageTitle";
import { useJournal } from "@/lib/queries";
import { InlineSkeleton, PageError, PageEmpty } from "@/components/UIStates";
import { LazyImage } from "@/components/LazyImage";
import { formatJournalDate } from "@/components/JournalArticle";
import type { JournalArticleSummary } from "@/lib/types";

const CATEGORIES = ["All", "Release Story", "Artist Spotlight", "Label News", "Behind The Scenes", "Interview", "Track Story", "Album Story"] as const;

const Card = ({ a }: { a: JournalArticleSummary }) => (
  <Link to={`/journal/${encodeURIComponent(a.slug)}`} className="group block hover-zoom focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">
    <div className="relative aspect-[4/3] bg-ivory/5 overflow-hidden">
      {a.coverImage ? (
        <LazyImage src={a.coverImage} alt={a.imageAlt || `${a.title} cover image`} width={1200} height={900} displayWidth={640} sizes="(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw" className="object-cover" />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-ink to-ivory/10" />
      )}
    </div>
    <div className="pt-5">
      {a.category && <p className="eyebrow text-gold mb-3">{a.category}</p>}
      <h3 className="font-serif text-2xl md:text-3xl leading-tight text-ivory">{a.title}</h3>
      {a.excerpt && <p className="text-sm text-ivory/65 mt-3 line-clamp-3 leading-relaxed">{a.excerpt}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] uppercase tracking-[0.22em] text-ivory/50">
        {a.artists[0] && <span>{a.artists[0].name}</span>}
        {a.releases[0] && <span>{a.releases[0].title}</span>}
        {a.publishedDate && <span>{formatJournalDate(a.publishedDate)}</span>}
        {a.readingTime > 0 && <span>{a.readingTime} min read</span>}
      </div>
    </div>
  </Link>
);

const Hero = ({ a }: { a: JournalArticleSummary }) => (
  <Link to={`/journal/${encodeURIComponent(a.slug)}`} className="group grid lg:grid-cols-12 gap-8 lg:gap-14 items-center border-b border-ivory/10 pb-16 mb-16 hover-zoom">
    <div className="lg:col-span-7 relative aspect-[16/10] bg-ivory/5 overflow-hidden">
      {a.coverImage ? (
        <LazyImage src={a.coverImage} alt={a.imageAlt || `${a.title} cover image`} width={1600} height={1000} displayWidth={1200} sizes="(min-width:1024px) 60vw, 100vw" className="object-cover" />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-ink to-ivory/10" />
      )}
    </div>
    <div className="lg:col-span-5">
      <p className="eyebrow text-gold mb-5">{a.featured ? "Featured" : "Latest"} {a.category && `— ${a.category}`}</p>
      <h2 className="display-serif text-4xl md:text-6xl text-ivory leading-[1.04] mb-6">{a.title}</h2>
      {a.excerpt && <p className="text-ivory/75 text-lg leading-relaxed mb-6">{a.excerpt}</p>}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] uppercase tracking-[0.24em] text-ivory/55">
        {a.artists[0] && <span>{a.artists[0].name}</span>}
        {a.releases[0] && <span>{a.releases[0].title}</span>}
        {a.publishedDate && <span>{formatJournalDate(a.publishedDate)}</span>}
        {a.readingTime > 0 && <span>{a.readingTime} min read</span>}
      </div>
    </div>
  </Link>
);

const Journal = () => {
  const { data: articles = [], isLoading, isError } = useJournal();
  const [cat, setCat] = useState<string>("All");

  const { hero, rest } = useMemo(() => {
    const filtered = cat === "All" ? articles : articles.filter((a) => a.category === cat);
    const hero = filtered.find((a) => a.featured) ?? filtered[0] ?? null;
    const rest = filtered.filter((a) => a !== hero);
    return { hero, rest };
  }, [articles, cat]);

  if (isError) return <PageError message="Couldn't load the Journal." />;

  return (
    <div className="bg-ink text-ivory pb-32 min-h-screen">
      <PageTitle title="Journal" />
      <section className="container-editorial pt-40 pb-16">
        <p className="eyebrow text-gold-soft mb-6">The Journal</p>
        <h1 className="display-serif text-6xl md:text-8xl lg:text-9xl mb-8">Journal</h1>
        <p className="max-w-2xl text-lg text-ivory/65">
          Stories from the studio, interviews, release notes and label news from WMG.
        </p>
      </section>

      <div className="container-editorial">
        <div className="flex flex-wrap gap-x-6 gap-y-3 border-y border-ivory/15 py-5 mb-16">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`text-[11px] uppercase tracking-[0.24em] transition-colors ${cat === c ? "text-gold" : "text-ivory/55 hover:text-ivory"}`}
            >
              {c}
            </button>
          ))}
        </div>

        {isLoading ? (
          <InlineSkeleton count={6} />
        ) : !hero ? (
          <PageEmpty title="No articles yet." description="New stories will appear here once published." />
        ) : (
          <>
            <Hero a={hero} />
            {rest.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12">
                {rest.map((a) => <Card key={a.id} a={a} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Journal;
