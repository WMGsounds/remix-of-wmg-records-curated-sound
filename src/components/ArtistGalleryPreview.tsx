import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useGallery } from "@/lib/queries";
import { GalleryLightbox } from "@/components/GalleryLightbox";
import type { Artist, GalleryImage } from "@/lib/types";

const objectPosition = (focalPoint: string) => {
  switch ((focalPoint || "").toLowerCase()) {
    case "top":
      return "center top";
    case "bottom":
      return "center bottom";
    case "left":
      return "left center";
    case "right":
      return "right center";
    default:
      return "center";
  }
};

const timeOf = (image: GalleryImage) =>
  Date.parse(image.imageDate || image.publishDate || "") || 0;

type Props = { artist: Pick<Artist, "id" | "name" | "slug"> };

export const ArtistGalleryPreview = ({ artist }: Props) => {
  const { data: images = [] } = useGallery();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const preview = useMemo(() => {
    const seen = new Set<string>();
    const matches = images.filter((i) => {
      const isMatch = i.artistSlug ? i.artistSlug === artist.slug : i.artistName === artist.name;
      if (!isMatch || seen.has(i.id)) return false;
      seen.add(i.id);
      return true;
    });
    return matches
      .sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        const ao = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
        const bo = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
        if (ao !== bo) return ao - bo;
        return timeOf(b) - timeOf(a);
      })
      .slice(0, 4);
  }, [images, artist.slug, artist.name]);

  if (preview.length === 0) return null;

  return (
    <section className="bg-ink text-ivory py-24 md:py-32 border-t border-ivory/10">
      <div className="container-editorial">
        <p className="eyebrow mb-4 text-gold-soft">Gallery</p>
        <h2 className="display-serif text-4xl md:text-6xl mb-12">From the Gallery</h2>
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {preview.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setLightboxIndex(index)}
              aria-label={`Open image: ${image.altText || image.title || artist.name}`}
              className="group block w-full overflow-hidden border border-ivory/12 bg-ivory/[0.03] transition-colors duration-500 hover:border-gold/45 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                <img
                  src={image.imageUrl}
                  alt={image.altText || image.title || `${artist.name} gallery image`}
                  loading="lazy"
                  decoding="async"
                  style={{ objectPosition: objectPosition(image.focalPoint) }}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
            </button>
          ))}
        </div>
        <div className="mt-12 flex justify-center">
          <Link
            to={`/gallery?artist=${encodeURIComponent(artist.slug)}`}
            className="inline-flex items-center gap-3 border-b border-ivory/70 pb-2 text-[12px] uppercase tracking-[0.24em] hover:text-gold hover:border-gold transition-colors duration-500"
          >
            Visit the gallery <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {lightboxIndex !== null && preview[lightboxIndex] && (
        <GalleryLightbox
          images={preview}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </section>
  );
};

export default ArtistGalleryPreview;
