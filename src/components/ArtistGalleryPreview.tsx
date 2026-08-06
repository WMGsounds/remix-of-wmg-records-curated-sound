import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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

const ratioOf = (image: GalleryImage) =>
  image.aspectRatio && image.aspectRatio > 0 ? image.aspectRatio : 3 / 4;

const GAP = 24;
const TARGET_H = 300;
const MIN_H = 200;
const MAX_H = 380;

type Tile = { image: GalleryImage; index: number };

/** Classic justified-gallery row packing: keeps native proportions, clamps row height. */
const buildRows = (tiles: Tile[], width: number) => {
  const rows: { tiles: Tile[]; height: number }[] = [];
  let current: Tile[] = [];
  for (const tile of tiles) {
    current.push(tile);
    const sum = current.reduce((acc, t) => acc + ratioOf(t.image), 0);
    const avail = width - GAP * (current.length - 1);
    const h = avail / sum;
    if (h <= TARGET_H) {
      rows.push({ tiles: current, height: Math.max(h, MIN_H) });
      current = [];
    }
  }
  if (current.length) {
    const sum = current.reduce((acc, t) => acc + ratioOf(t.image), 0);
    const avail = width - GAP * (current.length - 1);
    rows.push({ tiles: current, height: Math.min(Math.max(avail / sum, MIN_H), MAX_H) });
  }
  return rows;
};

const useMeasuredWidth = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
};

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
  ratioStyle,
}: {
  image: GalleryImage;
  artistName: string;
  onSelect: () => void;
  style?: React.CSSProperties;
  ratioStyle?: React.CSSProperties;
}) => (
  <button
    type="button"
    onClick={onSelect}
    aria-label={`Open image: ${image.altText || image.title || artistName}`}
    style={style}
    className="group block overflow-hidden border border-ivory/12 bg-ivory/[0.03] transition-colors duration-500 hover:border-gold/45 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
  >
    <div className="relative w-full overflow-hidden" style={ratioStyle}>
      <img
        src={image.imageUrl}
        alt={image.altText || image.title || `${artistName} gallery image`}
        loading="lazy"
        decoding="async"
        style={{ objectPosition: objectPosition(image.focalPoint) }}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
      />
    </div>
  </button>
);

export const ArtistGalleryPreview = ({ artist }: Props) => {
  const { data: images = [] } = useGallery();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { ref, width } = useMeasuredWidth();
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

  const tiles: Tile[] = preview.map((image, index) => ({ image, index }));

  const rows = useMemo(
    () => (isDesktop && width > 0 ? buildRows(tiles, width) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDesktop, width, preview],
  );

  const columns: Tile[][] = Array.from({ length: columnCount }, () => []);
  tiles.forEach((tile) => columns[tile.index % columnCount].push(tile));

  if (preview.length === 0) return null;

  return (
    <section className="bg-ink text-ivory py-24 md:py-32 border-t border-ivory/10">
      <div className="container-editorial">
        <p className="eyebrow mb-4 text-gold-soft">Gallery</p>
        <h2 className="display-serif text-4xl md:text-6xl mb-12">From the Gallery</h2>

        <div ref={ref}>
          {isDesktop ? (
            /* Extra vertical padding gives the offset tiles room; nothing here clips them. */
            <div className="space-y-6 py-5">
              {rows.map((row, ri) => (
                <div key={ri} className="flex items-start gap-6">
                  {row.tiles.map(({ image, index }) => (
                    <Tile
                      key={image.id}
                      image={image}
                      artistName={artist.name}
                      onSelect={() => setLightboxIndex(index)}
                      style={{
                        width: `${ratioOf(image) * row.height}px`,
                        transform: `translateY(${index % 2 === 1 ? 14 : 0}px)`,
                      }}
                      ratioStyle={{ height: `${row.height}px` }}
                    />
                  ))}
                </div>
              ))}
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
                        onSelect={() => setLightboxIndex(index)}
                        style={{ width: "100%" }}
                        ratioStyle={{ aspectRatio: String(ratioOf(image)) }}
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
