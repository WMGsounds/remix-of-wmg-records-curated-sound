import { useMemo, useState } from "react";
import { Seo } from "@/components/Seo";
import { breadcrumbSchema } from "@/lib/seo";
import { useGallery } from "@/lib/queries";
import { InlineSkeleton, PageError } from "@/components/UIStates";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterField, SearchInput } from "@/components/FilterBar";
import { matchesSearch } from "@/lib/search";
import { GalleryGrid } from "@/components/GalleryGrid";
import { GalleryLightbox } from "@/components/GalleryLightbox";

const ALL = "all";
const sortOptions = ["Curated", "Newest", "Artist"] as const;

const Gallery = () => {
  const { data: images = [], isLoading, isError } = useGallery();
  const [artist, setArtist] = useState<string>(ALL);
  const [type, setType] = useState<string>(ALL);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sort, setSort] = useState<(typeof sortOptions)[number]>("Curated");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const artistOptions = useMemo(() => {
    const map = new Map<string, string>();
    images.forEach((i) => {
      const key = i.artistSlug || i.artistName;
      if (key && i.artistName && !map.has(key)) map.set(key, i.artistName);
    });
    return [...map.entries()].map(([k, name]) => ({ key: k, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [images]);

  const typeOptions = useMemo(
    () => [...new Set(images.map((i) => i.imageType).filter(Boolean))].sort(),
    [images],
  );

  const visible = useMemo(() => {
    const list = images.filter((i) => {
      if (artist !== ALL && (i.artistSlug || i.artistName) !== artist) return false;
      if (type !== ALL && i.imageType !== type) return false;
      return matchesSearch(searchQuery, [i.title, i.artistName, i.caption, i.imageType, i.relatedRelease]);
    });
    switch (sort) {
      case "Newest":
        return [...list].sort(
          (a, b) => (b.imageDate ? Date.parse(b.imageDate) : 0) - (a.imageDate ? Date.parse(a.imageDate) : 0),
        );
      case "Artist":
        return [...list].sort((a, b) => a.artistName.localeCompare(b.artistName));
      default:
        return list;
    }
  }, [images, artist, type, searchQuery, sort]);

  if (isError) return <PageError message="Couldn't load the gallery." />;

  return (
    <div className="bg-ink text-ivory pb-32">
      <Seo
        title="Gallery"
        description="The WMG visual archive: portraits, live performance, studio sessions and behind-the-scenes photography from across the Wareham Music Group roster."
        canonicalPath="/gallery"
        jsonLd={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Gallery", path: "/gallery" },
        ])}
      />

      <section className="relative overflow-hidden bg-ink pt-40 pb-24 md:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_38%,hsl(var(--golden-brown)/0.38),transparent_34%),radial-gradient(circle_at_18%_78%,hsl(var(--gold)/0.16),transparent_28%)]" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,hsl(var(--ivory)/0.8)_1px,transparent_1px),linear-gradient(0deg,hsl(var(--ivory)/0.8)_1px,transparent_1px)] [background-size:3px_3px]" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_42%,hsl(var(--ink)/0.72)_100%)]" aria-hidden="true" />
        <div className="relative container-editorial">
          <p className="eyebrow mb-6 text-gold-soft">The Visual Archive</p>
          <h1 className="display-serif text-6xl md:text-8xl lg:text-9xl mb-10">Gallery</h1>
          <p className="max-w-2xl text-lg text-ivory/65">
            Portraits, live performance, studio sessions and the moments in between — a growing
            visual record of the artists and records that make up Wareham Music Group.
          </p>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-ink" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gold/35" aria-hidden="true" />
      </section>

      <div className="container-editorial pt-16">
        <div className="flex flex-wrap items-end justify-between gap-y-6 mb-16 border-y border-ivory/18 py-6">
          <div className="flex flex-wrap items-end gap-x-8 gap-y-6">
            <FilterField label="Artist">
              <Select value={artist} onValueChange={setArtist}>
                <SelectTrigger className="w-[200px] bg-transparent border-ivory/24 text-[11px] uppercase tracking-[0.24em] text-ivory rounded-none focus:ring-ivory">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-ink text-ivory border-ivory/24">
                  <SelectItem value={ALL} className="text-[11px] uppercase tracking-[0.24em] focus:bg-ivory/10 focus:text-ivory">
                    All Artists
                  </SelectItem>
                  {artistOptions.map((a) => (
                    <SelectItem key={a.key} value={a.key} className="text-[11px] uppercase tracking-[0.24em] focus:bg-ivory/10 focus:text-ivory">
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label="Image Type">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-[200px] bg-transparent border-ivory/24 text-[11px] uppercase tracking-[0.24em] text-ivory rounded-none focus:ring-ivory">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-ink text-ivory border-ivory/24">
                  <SelectItem value={ALL} className="text-[11px] uppercase tracking-[0.24em] focus:bg-ivory/10 focus:text-ivory">
                    All Types
                  </SelectItem>
                  {typeOptions.map((t) => (
                    <SelectItem key={t} value={t} className="text-[11px] uppercase tracking-[0.24em] focus:bg-ivory/10 focus:text-ivory">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
          </div>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-6">
            <FilterField label="Search">
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search gallery" />
            </FilterField>
            <FilterField label="Sort by">
              <Select value={sort} onValueChange={(v) => setSort(v as (typeof sortOptions)[number])}>
                <SelectTrigger className="w-[180px] bg-transparent border-ivory/24 text-[11px] uppercase tracking-[0.24em] text-ivory rounded-none focus:ring-ivory">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-ink text-ivory border-ivory/24">
                  {sortOptions.map((o) => (
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
          <InlineSkeleton count={9} />
        ) : visible.length === 0 ? (
          <div className="border border-ivory/14 px-8 py-24 text-center">
            <p className="eyebrow mb-4 text-gold-soft">The Visual Archive</p>
            <p className="text-lg text-ivory/65">
              {images.length === 0
                ? "New photography is being catalogued. Please check back soon."
                : "No images match these filters."}
            </p>
          </div>
        ) : (
          <GalleryGrid images={visible} onSelect={setLightboxIndex} />
        )}
      </div>

      {lightboxIndex !== null && visible[lightboxIndex] && (
        <GalleryLightbox
          images={visible}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
};

export default Gallery;
