import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const PROXY_PREFIX = "/api/image-proxy";
const RESPONSIVE_WIDTHS = [320, 480, 640, 960, 1280, 1600, 1920];

const isProxiedNotionImage = (src: string) => src.startsWith(`${PROXY_PREFIX}?`);

const buildResizedUrl = (src: string, width: number): string => {
  if (!isProxiedNotionImage(src)) return src;
  const sep = src.includes("&w=") || /[?&]w=/.test(src) ? "" : `&w=${width}`;
  return sep ? `${src}${sep}` : src;
};

const buildBlurUrl = (src: string): string | null => {
  if (!isProxiedNotionImage(src)) return null;
  return `${src}&blur=1`;
};

const buildSrcSet = (src: string, maxWidth: number): string => {
  if (!isProxiedNotionImage(src)) return "";
  return RESPONSIVE_WIDTHS
    .filter((w) => w <= Math.max(maxWidth, 320) * 2) // allow up to 2x for retina
    .map((w) => `${buildResizedUrl(src, w)} ${w}w`)
    .join(", ");
};

type LazyImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  wrapperClassName?: string;
  sizes?: string;
  /** Display width in CSS px at the largest breakpoint. Used to choose a sensible base width. */
  displayWidth?: number;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
  /** When true, the image fills its parent (which must be positioned). No aspect-ratio wrapper is added. */
  fill?: boolean;
};

export const LazyImage = ({
  src,
  alt,
  width,
  height,
  className,
  wrapperClassName,
  sizes,
  displayWidth,
  loading = "lazy",
  fetchPriority,
  fill = false,
}: LazyImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const proxied = isProxiedNotionImage(src);
  const targetWidth = displayWidth ?? Math.min(width, 1280);

  const finalSrc = proxied ? buildResizedUrl(src, targetWidth) : src;
  const srcSet = proxied ? buildSrcSet(src, targetWidth) : undefined;
  const blurUrl = proxied ? buildBlurUrl(src) : null;

  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, [finalSrc]);

  const imgEl = (
    <>
      {blurUrl && (
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 bg-cover bg-center scale-110 transition-opacity duration-700",
            loaded ? "opacity-0" : "opacity-100"
          )}
          style={{ backgroundImage: `url(${blurUrl})` }}
        />
      )}
      <img
        ref={imgRef}
        src={finalSrc}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
        // @ts-expect-error fetchPriority is valid in modern React/DOM
        fetchpriority={fetchPriority}
        onLoad={() => setLoaded(true)}
        className={cn(
          "absolute inset-0 h-full w-full transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
      />
    </>
  );

  if (fill) {
    // Caller controls the wrapper sizing; we just render the layered children.
    return <>{imgEl}</>;
  }

  return (
    <div
      className={cn("relative overflow-hidden", wrapperClassName)}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {imgEl}
    </div>
  );
};

