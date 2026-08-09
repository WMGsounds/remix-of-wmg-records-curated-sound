import { useEffect, useState } from "react";
import type { GalleryImage } from "@/lib/types";

type Props = {
  images: GalleryImage[];
  onSelect: (index: number) => void;
  /** Added to the local index so sectioned grids share one lightbox list. */
  indexOffset?: number;
};

const objectPosition = (focalPoint: string) => {
  switch (focalPoint.toLowerCase()) {
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

const GalleryTile = ({ image, onSelect }: { image: GalleryImage; onSelect: () => void }) => {
  const [loaded, setLoaded] = useState(false);
  const ratio = image.aspectRatio && image.aspectRatio > 0 ? image.aspectRatio : 3 / 4;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Open image: ${image.altText}`}
      className="group mb-6 block w-full break-inside-avoid overflow-hidden border border-ivory/12 bg-ivory/[0.03] text-left transition-colors duration-500 hover:border-gold/45 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
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
          style={{ objectPosition: objectPosition(image.focalPoint) }}
          className={`h-full w-full object-cover transition-all duration-700 group-hover:scale-[1.03] ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      </div>
      {(image.title || image.artistName) && (
        <div className="space-y-1 px-4 py-4">
          {image.title && <h3 className="text-sm text-ivory/85">{image.title}</h3>}
          <p className="text-[10px] uppercase tracking-[0.28em] text-ivory/45">
            {[image.artistName, image.imageType].filter(Boolean).join(" · ")}
          </p>
        </div>
      )}
    </button>
  );
};

const useColumnCount = () => {
  const get = () => {
    if (typeof window === "undefined") return 3;
    if (window.matchMedia("(min-width: 1024px)").matches) return 3;
    if (window.matchMedia("(min-width: 640px)").matches) return 2;
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

export const GalleryGrid = ({ images, onSelect, indexOffset = 0 }: Props) => {
  const columnCount = useColumnCount();

  // Round-robin distribution keeps the left-to-right reading order of the
  // source list (CSS `columns` would fill column-by-column instead).
  const columns: { image: GalleryImage; index: number }[][] = Array.from(
    { length: columnCount },
    () => [],
  );
  images.forEach((image, index) => {
    columns[index % columnCount].push({ image, index });
  });

  return (
    <div className="flex gap-6">
      {columns.map((column, ci) => (
        <div key={ci} className="flex-1 min-w-0">
          {column.map(({ image, index }) => (
            <GalleryTile key={image.id} image={image} onSelect={() => onSelect(indexOffset + index)} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default GalleryGrid;
