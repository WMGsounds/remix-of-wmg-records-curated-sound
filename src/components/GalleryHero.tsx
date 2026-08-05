import type { GalleryImage } from "@/lib/types";
import { objectPositionFor } from "@/lib/gallery";

type Props = {
  /** Already-curated hero selection (featured first). May be empty. */
  images: GalleryImage[];
  /** Inlined archive image used when the API supplies nothing usable. */
  fallbackImage: string;
};

/** Fixed frames keep the composition stable while images decode (no layout shift). */
const FRAMES = [
  "absolute right-[4%] top-1/2 h-[380px] w-[300px] -translate-y-[54%] rotate-[-1.2deg] z-30",
  "absolute right-[32%] top-[8%] h-[248px] w-[196px] rotate-[2deg] z-20",
  "absolute right-[26%] bottom-[4%] h-[212px] w-[268px] rotate-[-2.4deg] z-10",
];

export const GalleryHero = ({ images, fallbackImage }: Props) => {
  const usable = images.filter((i) => i.imageUrl).slice(0, 3);

  return (
    <div className="relative hidden min-h-[360px] lg:block">
      <div className="absolute right-0 top-1/2 h-[560px] w-full -translate-y-1/2 overflow-hidden [-webkit-mask-image:linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.08)_14%,rgba(0,0,0,0.42)_26%,black_44%,black_56%,rgba(0,0,0,0.42)_74%,rgba(0,0,0,0.08)_86%,transparent_100%)] [mask-image:linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.08)_14%,rgba(0,0,0,0.42)_26%,black_44%,black_56%,rgba(0,0,0,0.42)_74%,rgba(0,0,0,0.08)_86%,transparent_100%)]">
        <div className="h-full w-full [-webkit-mask-image:radial-gradient(ellipse_at_center,black_28%,rgba(0,0,0,0.72)_50%,rgba(0,0,0,0.3)_70%,transparent_88%)] [mask-image:radial-gradient(ellipse_at_center,black_28%,rgba(0,0,0,0.72)_50%,rgba(0,0,0,0.3)_70%,transparent_88%)] [mask-repeat:no-repeat] [mask-size:100%_100%]">
          {usable.length === 0 ? (
            <div
              aria-hidden="true"
              className="h-full w-full bg-no-repeat opacity-90"
              style={{
                backgroundImage: `url(${fallbackImage})`,
                backgroundSize: "auto 100%",
                backgroundPosition: "right 90px center",
              }}
            />
          ) : (
            <div className="relative h-full w-full">
              {usable.map((image, i) => (
                <figure
                  key={image.id}
                  className={`${FRAMES[i]} overflow-hidden border border-gold/25 bg-ink/60 shadow-[0_28px_60px_-24px_hsl(var(--ink)/0.95)]`}
                >
                  <img
                    src={image.imageUrl}
                    alt={image.altText}
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                    style={{ objectPosition: objectPositionFor(image.focalPoint) }}
                    className="h-full w-full object-cover opacity-[0.92]"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--ink)/0.05),hsl(var(--ink)/0.55))]"
                  />
                </figure>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GalleryHero;
