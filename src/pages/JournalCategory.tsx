import { useMemo } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { breadcrumbSchema } from "@/lib/seo";
import { useJournal } from "@/lib/queries";
import { InlineSkeleton, PageError, PageEmpty } from "@/components/UIStates";
import { LazyImage } from "@/components/LazyImage";
import { formatJournalDate } from "@/components/JournalArticle";
import type { JournalArticleSummary } from "@/lib/types";

const SLUG_TO_CATEGORY: Record<string, string> = {
  "release-story": "Release Story",
  "artist-spotlight": "Artist Spotlight",
  "label-news": "Label News",
  "behind-the-scenes": "Behind The Scenes",
  "interview": "Interview",
  "track-story": "Track Story",
  "album-story": "Album Story",
};

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const Card = ({ a }: { a: JournalArticleSummary }) => (
  <Link to={`/journal/${encodeURIComponent(a.slug)}`} className="group block hover-zoom focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">
    <div className="relative aspect-[4/3] bg-ink overflow-hidden">
      {a.coverImage ? (
        <LazyImage src={a.coverImage} alt={a.imageAlt || `${a.title} cover image`} width={1200} height={900} displayWidth={640} sizes="(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw" className="object-contain" />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-ink to-ivory/10" />
      )}
    </div>
    <div className="pt-5">
      {a.category && <p className="eyebrow text-gold mb-3">{a.category}</p>}
      <h2 className="font-serif text-2xl md:text-3xl leading-tight text-ivory">{a.title}</h2>
      {a.excerpt && <p className="text-sm text-ivory/65 mt-3 line-clamp-3 leading-relaxed">{a.excerpt}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] uppercase tracking-[0.22em] text-ivory/50">
        {a.publishedDate && <span>{formatJournalDate(a.publishedDate)}</span>}
        {a.readingTime > 0 && <span>{a.readingTime} min read</span>}
      </div>
    </div>
  </Link>
);

const JournalCategory = () => {
  const { slug = "" } = useParams();
  const { data: articles = [], isLoading, isError } = useJournal();

  const categoryName = useMemo(() => {
    if (SLUG_TO_CATEGORY[slug]) return SLUG_TO_CATEGORY[slug];
    const match = articles.find((a) => slugify(a.category) === slug);
    return match?.category || "";
  }, [slug, articles]);

  const filtered = useMemo(
    () => articles.filter((a) => slugify(a.category) === slug),
    [articles, slug],
  );

  if (isError) return <PageError message="Couldn't load the Journal." />;
  if (!isLoading && !categoryName && filtered.length === 0) {
    return <Navigate to="/journal" replace />;
  }

  const path = `/journal/category/${slug}`;
  const title = `${categoryName || "Category"} | WMG Journal`;
  const description = `${categoryName} stories from WMG Records — release notes, artist features and label editorial from Wareham Music Group.`;

  return (
    <div className="bg-ink text-ivory pb-32 min-h-screen">
      <Seo
        title={title.replace(" | WMG Records", "")}
        description={description}
        canonicalPath={path}
        jsonLd={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Journal", path: "/journal" },
          { name: categoryName || "Category", path },
        ])}
      />
      <section className="container-editorial pt-40 pb-16">
        <p className="eyebrow text-gold-soft mb-6">
          <Link to="/journal" className="link-underline hover:text-gold">The Journal</Link>
        </p>
        <h1 className="display-serif text-6xl md:text-8xl mb-8">{categoryName || "Category"}</h1>
        <p className="max-w-2xl text-lg text-ivory/65">{description}</p>
      </section>

      <div className="container-editorial">
        {isLoading ? (
          <InlineSkeleton count={6} />
        ) : filtered.length === 0 ? (
          <PageEmpty title="No articles in this category yet." description="New stories will appear here once published." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12">
            {filtered.map((a) => <Card key={a.id} a={a} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalCategory;
