import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { breadcrumbSchema } from "@/lib/seo";
import { useJournal } from "@/lib/queries";
import { InlineSkeleton, PageError, PageEmpty } from "@/components/UIStates";
import { LazyImage } from "@/components/LazyImage";
import { formatJournalDate } from "@/components/JournalArticle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterField, SearchInput } from "@/components/FilterBar";
import { matchesSearch } from "@/lib/search";
import type { JournalArticleSummary } from "@/lib/types";

const CATEGORIES = ["All", "Release Story", "Artist Spotlight", "Label News", "Behind The Scenes", "Interview", "Track Story", "Album Story"] as const;
const SORT_OPTIONS = ["Newest", "Oldest", "Title"] as const;

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
      <h3 className="font-serif text-2xl md:text-3xl leading-tight text-ivory">{a.title}</h3>
      {a.excerpt && <p className="text-sm text-ivory/65 mt-3 line-clamp-3 leading-relaxed">{a.excerpt}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] uppercase tracking-[0.22em] text-ivory/70">
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
    <div className="lg:col-span-7 relative aspect-[16/10] bg-ink overflow-hidden">
      {a.coverImage ? (
        <LazyImage src={a.coverImage} alt={a.imageAlt || `${a.title} cover image`} width={1600} height={1000} displayWidth={1200} sizes="(min-width:1024px) 60vw, 100vw" className="object-contain" />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-ink to-ivory/10" />
      )}
    </div>
    <div className="lg:col-span-5">
      <p className="eyebrow text-gold mb-5">{a.featured ? "Featured" : "Latest"} {a.category && `— ${a.category}`}</p>
      <h2 className="display-serif text-4xl md:text-6xl text-ivory leading-[1.1] mb-6">{a.title}</h2>
      {a.excerpt && <p className="text-ivory/75 text-lg leading-relaxed mb-6">{a.excerpt}</p>}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] uppercase tracking-[0.24em] text-ivory/75">
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
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]>("Newest");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { hero, rest } = useMemo(() => {
    const byCat = cat === "All" ? [...articles] : articles.filter((a) => a.category === cat);
    const filtered = byCat.filter((a) =>
      matchesSearch(searchQuery, [
        a.title,
        a.excerpt,
        a.category,
        a.artists[0]?.name,
        a.releases[0]?.title,
      ]),
    );
    const dateOf = (a: JournalArticleSummary) => +new Date(a.publishedDate || a.lastEditedTime || a.createdTime);
    switch (sort) {
      case "Oldest":
        filtered.sort((a, b) => dateOf(a) - dateOf(b));
        break;
      case "Title":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "Newest":
      default:
        filtered.sort((a, b) => dateOf(b) - dateOf(a));
    }
    const hero = filtered.find((a) => a.featured) ?? filtered[0] ?? null;
    const rest = filtered.filter((a) => a !== hero);
    return { hero, rest };
  }, [articles, cat, sort, searchQuery]);

  if (isError) return <PageError message="Couldn't load the Journal." />;

  return (
    <div className="bg-ink text-ivory pb-32 min-h-screen">
      <Seo
        title="Journal"
        description="Read WMG Journal stories, including release stories, artist spotlights, album features and behind-the-scenes editorial from Wareham Music Group."
        canonicalPath="/journal"
        jsonLd={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Journal", path: "/journal" },
        ])}
      />
      <section className="relative overflow-hidden bg-ink pt-40 pb-24 md:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_38%,hsl(var(--golden-brown)/0.38),transparent_34%),radial-gradient(circle_at_18%_78%,hsl(var(--gold)/0.16),transparent_28%)]" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,hsl(var(--ivory)/0.8)_1px,transparent_1px),linear-gradient(0deg,hsl(var(--ivory)/0.8)_1px,transparent_1px)] [background-size:3px_3px]" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_42%,hsl(var(--ink)/0.72)_100%)]" aria-hidden="true" />
        <div className="relative container-editorial grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow text-gold-soft mb-6">The Journal</p>
            <h1 className="display-serif text-6xl md:text-8xl lg:text-9xl mb-8">Journal</h1>
            <p className="max-w-2xl text-lg text-ivory/65">
              Stories from the studio, interviews, release notes and label news from WMG.
            </p>
          </div>
          <div className="relative hidden min-h-[360px] lg:block">
            <div className="absolute right-0 top-1/2 h-[560px] w-full -translate-y-1/2 overflow-hidden [-webkit-mask-image:linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.08)_14%,rgba(0,0,0,0.42)_26%,black_44%,black_56%,rgba(0,0,0,0.42)_74%,rgba(0,0,0,0.08)_86%,transparent_100%)] [mask-image:linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.08)_14%,rgba(0,0,0,0.42)_26%,black_44%,black_56%,rgba(0,0,0,0.42)_74%,rgba(0,0,0,0.08)_86%,transparent_100%)] [mask-repeat:no-repeat] [mask-size:100%_100%]">
              <div className="h-full w-full [-webkit-mask-image:radial-gradient(ellipse_at_center,black_18%,rgba(0,0,0,0.68)_38%,rgba(0,0,0,0.28)_58%,transparent_78%)] [mask-image:radial-gradient(ellipse_at_center,black_18%,rgba(0,0,0,0.68)_38%,rgba(0,0,0,0.28)_58%,transparent_78%)] [mask-repeat:no-repeat] [mask-size:100%_100%]">
                <div
                  aria-hidden="true"
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(/images/journal-hero.png)` }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-ink" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gold/35" aria-hidden="true" />
      </section>

      <div className="container-editorial pt-16">
        <div className="flex flex-wrap items-end justify-between gap-y-6 mb-16 border-y border-ivory/18 py-6">
          <div className="flex flex-wrap items-end gap-x-8 gap-y-6">
            <FilterField label="Category">
              <Select value={cat} onValueChange={setCat}>
                <SelectTrigger className="w-[200px] bg-transparent border-ivory/24 text-[11px] uppercase tracking-[0.24em] text-ivory rounded-none focus:ring-ivory">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-ink text-ivory border-ivory/24">
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="text-[11px] uppercase tracking-[0.24em] focus:bg-ivory/10 focus:text-ivory">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label="Search">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search articles"
              />
            </FilterField>
          </div>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-6">
            <FilterField label="Sort by">
              <Select value={sort} onValueChange={(v) => setSort(v as (typeof SORT_OPTIONS)[number])}>
                <SelectTrigger className="w-[160px] bg-transparent border-ivory/24 text-[11px] uppercase tracking-[0.24em] text-ivory rounded-none focus:ring-ivory">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-ink text-ivory border-ivory/24">
                  {SORT_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o} className="text-[11px] uppercase tracking-[0.24em] focus:bg-ivory/10 focus:text-ivory">
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
          </div>
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
