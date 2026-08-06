import { useEffect, useMemo, useState } from "react";
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

/** Safe numeric aspect ratio, clamped so extreme panoramas/slivers stay usable. */
const ratioOf = (image: GalleryImage) => {
  const parsed = Number(image.aspectRatio);
  const ratio = Number.isFinite(parsed) && parsed > 0 ? parsed : 3 / 4;
  return Math.min(Math.max(ratio, 0.5), 2);
};

type TileItem = { image: GalleryImage; index: number };

const useBreakpointColumns = () => {
  const get = () => {
    if (typeof window === "undefined") return 3;
    if (window.matchMedia("(min-width: 768px)").matches) return 3;
    if (window.matchMedia("(min-width: 420px)").matches) return 2;
    return 1;
  };
  const [count, setCount] = useState(get);
  useEffect(() => {
    const onResize = () => setCount(get());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return count;
};

const useIsDesktop = () => {
  const get = () => (typeof window === "undefined" ? true : window.innerWidth >= 1024);
  const [isDesktop, setIsDesktop] = useState(get);
  useEffect(() => {
    const onResize = () => setIsDesktop(get());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isDesktop;
};

type Props = { artist: Pick<Artist, "id" | "name" | "slug"> };

const Tile = ({
  image,
  artistName,
  onSelect,
  style,
  ratio,
}: {
  image: GalleryImage;
  artistName: string;
  onSelect: () => void;
  style?: React.CSSProperties;
  ratio: number;
}) => (
  <button
    type="button"
    onClick={onSelect}
    aria-label={`Open image: ${image.altText || image.title || artistName}`}
    style={style}
    className="group block overflow-hidden border border-ivory/12 bg-ivory/[0.03] transition-colors duration-500 hover:border-gold/45 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
  >
    <div
      className="relative w-full overflow-hidden"
      style={{ aspectRatio: String(ratio) }}
    >
      <img
        src={image.imageUrl}
        alt={image.altText || image.title || `${artistName} gallery image`}
        loading="lazy"
        decoding="async"
        style={{ objectPosition: objectPosition(image.focalPoint) }}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
      />
    </div>
  </button>
);

export const ArtistGalleryPreview = ({ artist }: Props) => {
  const { data: images = [] } = useGallery();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const isDesktop = useIsDesktop();
  const columnCount = useBreakpointColumns();

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

  const tiles: TileItem[] = preview.map((image, index) => ({ image, index }));

  const columns: TileItem[][] = Array.from({ length: columnCount }, () => []);
  tiles.forEach((tile) => columns[tile.index % columnCount].push(tile));

  if (preview.length === 0) return null;

  return (
    <section className="bg-ink text-ivory py-24 md:py-32 border-t border-ivory/10">
      <div className="container-editorial">
        <p className="eyebrow mb-4 text-gold-soft">Gallery</p>
        <h2 className="display-serif text-4xl md:text-6xl mb-12">From the Gallery</h2>

        <div>
          {isDesktop ? (
            /* Justified row: widths weighted by aspect ratio, heights set by the
               tile's own aspect-ratio wrapper. Extra padding gives offsets room. */
            <div className="flex items-start gap-6 py-5">
              {tiles.map(({ image, index }) => {
                const ratio = ratioOf(image);
                return (
                  <Tile
                    key={image.id}
                    image={image}
                    artistName={artist.name}
                    ratio={ratio}
                    onSelect={() => setLightboxIndex(index)}
                    style={{
                      flexGrow: ratio,
                      flexBasis: 0,
                      minWidth: 0,
                      transform: `translateY(${index % 2 === 1 ? 14 : 0}px)`,
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex gap-6">
              {columns.map((column, ci) => (
                <div key={ci} className="flex-1 min-w-0">
                  {column.map(({ image, index }) => (
                    <div key={image.id} className="mb-6">
                      <Tile
                        image={image}
                        artistName={artist.name}
                        ratio={ratioOf(image)}
                        onSelect={() => setLightboxIndex(index)}
                        style={{ width: "100%" }}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-14 flex justify-center">
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
