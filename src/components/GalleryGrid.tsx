import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { GalleryImage } from "@/lib/types";
import { enlargedTileIds, objectPositionFor } from "@/lib/gallery";

type Props = {
  images: GalleryImage[];
  onSelect: (index: number) => void;
};

const GAP = 24; // px, matches gap-6
const ROW = 8; // px masonry row unit

const columnsFor = (width: number) => (width >= 1024 ? 3 : width >= 640 ? 2 : 1);

const GalleryTile = ({
  image,
  span,
  columnWidth,
  onSelect,
}: {
  image: GalleryImage;
  span: number;
  columnWidth: number;
  onSelect: () => void;
}) => {
  const [loaded, setLoaded] = useState(false);
  const captionRef = useRef<HTMLDivElement>(null);
  const [captionHeight, setCaptionHeight] = useState(0);
  const ratio = image.aspectRatio && image.aspectRatio > 0 ? image.aspectRatio : 3 / 4;

  useLayoutEffect(() => {
    if (captionRef.current) setCaptionHeight(captionRef.current.offsetHeight);
  }, [image.id, columnWidth, span]);

  const tileWidth = columnWidth * span + GAP * (span - 1);
  const height = (tileWidth > 0 ? tileWidth / ratio : 320) + captionHeight;
  const rowSpan = Math.max(1, Math.ceil((height + GAP) / (ROW + GAP)));

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Open image: ${image.altText}`}
      style={{ gridColumn: `span ${span}`, gridRow: `span ${rowSpan}` }}
      className="group block w-full self-start overflow-hidden border border-ivory/12 bg-ivory/[0.03] text-left transition-colors duration-500 hover:border-gold/45 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
    >
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: String(ratio) }}>
        <div
          className={`absolute inset-0 bg-ivory/[0.04] transition-opacity duration-500 ${loaded ? "opacity-0" : "opacity-100"}`}
          aria-hidden="true"
        />
        <img
          src={image.imageUrl}
          alt={image.altText}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          style={{ objectPosition: objectPositionFor(image.focalPoint) }}
          className={`h-full w-full object-cover transition-all duration-700 group-hover:scale-[1.03] ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      </div>
      {(image.title || image.artistName) && (
        <div ref={captionRef} className="space-y-1 px-4 py-4">
          {image.title && (
            <p className={span > 1 ? "text-base text-ivory/90" : "text-sm text-ivory/85"}>{image.title}</p>
          )}
          <p className="text-[10px] uppercase tracking-[0.28em] text-ivory/45">
            {[image.artistName, image.imageType].filter(Boolean).join(" · ")}
          </p>
        </div>
      )}
    </button>
  );
};

export const GalleryGrid = ({ images, onSelect }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const columns = columnsFor(width || 1200);
  const columnWidth = width > 0 ? (width - GAP * (columns - 1)) / columns : 0;
  // Enlarged featured tiles only where more than one column exists.
  const enlarged = columns > 1 ? enlargedTileIds(images) : new Set<string>();

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      style={{ gap: `${GAP}px`, gridAutoRows: `${ROW}px` }}
    >
      {images.map((image, i) => (
        <GalleryTile
          key={image.id}
          image={image}
          span={enlarged.has(image.id) ? 2 : 1}
          columnWidth={columnWidth}
          onSelect={() => onSelect(i)}
        />
      ))}
    </div>
  );
};

export default GalleryGrid;
