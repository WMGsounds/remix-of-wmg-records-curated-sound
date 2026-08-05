import { useCallback, useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { GalleryImage } from "@/lib/types";

type Props = {
  images: GalleryImage[];
  index: number;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
};

export const GalleryLightbox = ({ images, index, onClose, onNavigate }: Props) => {
  const image = images[index];
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  const go = useCallback(
    (delta: number) => {
      if (images.length < 2) return;
      const next = (index + delta + images.length) % images.length;
      onNavigate(next);
    },
    [index, images.length, onNavigate],
  );

  useEffect(() => setLoaded(false), [index]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [go, onClose]);

  if (!image) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.title || "Gallery image"}
      className="fixed inset-0 z-[100] flex flex-col bg-ink/95 backdrop-blur-sm"
      onClick={onClose}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current;
        const end = e.changedTouches[0]?.clientX ?? null;
        touchStartX.current = null;
        if (start === null || end === null) return;
        const delta = end - start;
        if (Math.abs(delta) > 50) go(delta < 0 ? 1 : -1);
      }}
    >
      <div className="flex items-center justify-between px-5 py-4 md:px-10">
        <p className="text-[10px] uppercase tracking-[0.32em] text-ivory/50">
          {images.length > 1 ? `${index + 1} / ${images.length}` : "\u00a0"}
        </p>
        <button
          ref={closeRef}
          type="button"
          aria-label="Close gallery image"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="flex h-10 w-10 items-center justify-center border border-ivory/24 text-ivory/80 transition-colors hover:border-gold/60 hover:text-ivory focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center px-4 pb-6 md:px-16"
        onClick={(e) => e.stopPropagation()}
      >
        {images.length > 1 && (
          <button
            type="button"
            aria-label="Previous image"
            onClick={() => go(-1)}
            className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center border border-ivory/20 bg-ink/60 text-ivory/80 transition-colors hover:border-gold/60 hover:text-ivory focus:outline-none focus-visible:ring-1 focus-visible:ring-gold md:left-6"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <figure className="flex max-h-full flex-col items-center gap-5">
          <img
            src={image.imageUrl}
            alt={image.altText}
            onLoad={() => setLoaded(true)}
            className={`max-h-[68vh] w-auto max-w-full object-contain transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
          />
          <figcaption className="max-w-2xl space-y-2 px-2 text-center">
            {image.title && <p className="text-lg text-ivory">{image.title}</p>}
            {image.caption && <p className="text-sm text-ivory/60">{image.caption}</p>}
            <p className="text-[10px] uppercase tracking-[0.28em] text-ivory/40">
              {[image.artistName, image.imageType, image.credit && `Photo: ${image.credit}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {image.relatedReleaseUrl && (
              <a
                href={image.relatedReleaseUrl}
                className="inline-block text-[10px] uppercase tracking-[0.28em] text-gold-soft underline-offset-4 hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
              >
                View release: {image.relatedRelease}
              </a>
            )}
          </figcaption>
        </figure>

        {images.length > 1 && (
          <button
            type="button"
            aria-label="Next image"
            onClick={() => go(1)}
            className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center border border-ivory/20 bg-ink/60 text-ivory/80 transition-colors hover:border-gold/60 hover:text-ivory focus:outline-none focus-visible:ring-1 focus-visible:ring-gold md:right-6"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default GalleryLightbox;
