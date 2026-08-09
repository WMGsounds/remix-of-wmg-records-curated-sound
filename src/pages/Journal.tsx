import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { staticSeo } from "@/lib/seoConfig";
import { schemaFor } from "@/lib/schema";

import { useJournal } from "@/lib/queries";
import { InlineSkeleton, PageError, PageEmpty } from "@/components/UIStates";
import { LazyImage } from "@/components/LazyImage";
import { formatJournalDate } from "@/components/JournalArticle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterField, SearchInput } from "@/components/FilterBar";
import { matchesSearch } from "@/lib/search";
import type { JournalArticleSummary } from "@/lib/types";

const journalHeroDataUrl = "data:image/webp;base64,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";

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
        {...staticSeo("journal")}
        jsonLd={schemaFor("itemList", {
          path: "/journal",
          name: "WMG Journal",
          items: articles.map((a) => ({
            name: a.title,
            path: `/journal/${a.slug}`,
            image: a.coverImage,
          })),
        })}
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
                  style={{ backgroundImage: `url(${journalHeroDataUrl})` }}
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
          </div>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-6">
            <FilterField label="Search">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search articles"
              />
            </FilterField>
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
