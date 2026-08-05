import { useState } from "react";
import type { GalleryImage } from "@/lib/types";

type Props = {
  images: GalleryImage[];
  onSelect: (index: number) => void;
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
          {image.title && <p className="text-sm text-ivory/85">{image.title}</p>}
          <p className="text-[10px] uppercase tracking-[0.28em] text-ivory/45">
            {[image.artistName, image.imageType].filter(Boolean).join(" · ")}
          </p>
        </div>
      )}
    </button>
  );
};

export const GalleryGrid = ({ images, onSelect }: Props) => (
  <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
    {images.map((image, i) => (
      <GalleryTile key={image.id} image={image} onSelect={() => onSelect(i)} />
    ))}
  </div>
);

export default GalleryGrid;
