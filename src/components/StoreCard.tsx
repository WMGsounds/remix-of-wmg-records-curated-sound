import { LazyImage } from "@/components/LazyImage";
import type { StoreItem, StoreFormat } from "@/lib/types";

const FORMAT_DISPLAY_ORDER: StoreFormat[] = ["Vinyl", "CD", "iTunes", "Digital", "Merch", "Other"];

type ButtonState = {
  disabled: boolean;
  label: string;
  href?: string;
};

function resolveButton(item: StoreItem): ButtonState {
  switch (item.availability) {
    case "Available Now":
      if (item.purchaseLink) {
        return {
          disabled: false,
          label: item.buttonText?.trim() || "View Purchase Options",
          href: item.purchaseLink,
        };
      }
      return { disabled: true, label: "Link Coming Soon" };
    case "Coming Soon":
      return { disabled: true, label: "Coming Soon" };
    case "Sold Out":
      return { disabled: true, label: "Sold Out" };
    default:
      return { disabled: true, label: "Unavailable" };
  }
}

function statusLabelClass(availability: StoreItem["availability"]): string {
  switch (availability) {
    case "Available Now":
      return "border-gold/40 text-gold";
    case "Coming Soon":
      return "border-ivory/30 text-ivory/70";
    case "Sold Out":
      return "border-ivory/20 text-ivory/50";
    default:
      return "border-ivory/20 text-ivory/50";
  }
}

export const StoreCard = ({ item }: { item: StoreItem }) => {
  if (item.availability === "Hidden") return null;

  const button = resolveButton(item);
  const orderedFormats = FORMAT_DISPLAY_ORDER.filter((f) => item.formats.includes(f));
  const formatLine = orderedFormats.join(" · ");
  const artistName = item.artist?.name ?? "WMG";
  const ariaLabel = `View purchase options for ${item.title} by ${artistName}`;

  return (
    <article className="group flex h-full flex-col border border-gold/15 bg-ink/60 backdrop-blur-sm transition-all duration-500 hover:border-gold/45 hover:shadow-[0_30px_60px_-30px_hsl(var(--gold)/0.35)]">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {item.productImage ? (
          <LazyImage
            src={item.productImage}
            alt={`${item.title} by ${artistName}`}
            width={1200}
            height={1200}
            displayWidth={720}
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-6 text-center text-ivory/50">
            Artwork coming soon.
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-6 p-8 md:p-10">
        <div className="flex flex-wrap items-center gap-2 border-b border-ivory/10 pb-4">
          <span
            className={`inline-flex items-center border px-3 py-1 text-[10px] uppercase tracking-[0.24em] ${statusLabelClass(item.availability)}`}
          >
            {item.availability}
          </span>
          {item.featured && (
            <span className="inline-flex items-center border border-gold/40 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-gold">
              Featured
            </span>
          )}
          {item.displayPriceSummary && item.priceSummary && (
            <span className="ml-auto font-serif text-lg text-gold">{item.priceSummary}</span>
          )}
        </div>

        <header className="space-y-2">
          {item.artist && (
            <p className="eyebrow text-gold">{item.artist.name}</p>
          )}
          <h3 className="font-serif text-2xl leading-tight text-ivory md:text-3xl">
            {item.title}
          </h3>
        </header>

        {item.description && (
          <p className="text-[15px] leading-relaxed text-ivory/70">{item.description}</p>
        )}

        {orderedFormats.length > 0 && (
          <p className="text-xs uppercase tracking-[0.2em] text-ivory/65">
            <span className="text-ivory/45">Available in: </span>
            <span className="text-ivory/85">{formatLine}</span>
          </p>
        )}


        {orderedFormats.length > 0 && (
          <dl className="grid grid-cols-1 gap-2 text-[15px]">
            {orderedFormats.map((f) => {
              const raw = item.prices[f]?.trim();
              return (
                <div key={f} className="flex items-baseline justify-between gap-4 border-b border-ivory/10 pb-2">
                  <dt className="text-ivory/65">{f}</dt>
                  <dd className={raw ? "text-ivory" : "text-ivory/50 italic"}>
                    {raw || "See purchase page"}
                  </dd>
                </div>
              );
            })}
          </dl>
        )}

        {item.relatedTracks.length > 0 && (
          <details className="group/inc text-sm">
            <summary className="cursor-pointer list-none text-[11px] uppercase tracking-[0.24em] text-ivory/55 hover:text-ivory">
              Includes ({item.relatedTracks.length})
              <span className="ml-2 text-ivory/40 group-open/inc:hidden">+</span>
              <span className="ml-2 hidden text-ivory/40 group-open/inc:inline">−</span>
            </summary>
            <ul className="mt-3 space-y-1 text-ivory/70">
              {item.relatedTracks.map((t) => (
                <li key={t.id} className="text-sm">
                  {t.title}
                </li>
              ))}
            </ul>
          </details>
        )}

        <div className="mt-auto pt-4">
          {button.disabled ? (
            <button
              type="button"
              disabled
              aria-label={ariaLabel}
              className="block w-full cursor-not-allowed border border-ivory/15 px-6 py-3 text-center text-[11px] uppercase tracking-[0.24em] text-ivory/45"
            >
              {button.label}
            </button>
          ) : (
            <>
              <a
                href={button.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={ariaLabel}
                className="block w-full border border-gold bg-gold/10 px-6 py-3 text-center text-[11px] uppercase tracking-[0.24em] text-gold transition-colors hover:bg-gold hover:text-ink"
              >
                {button.label}
              </a>
              <p className="mt-2 text-center text-[10px] uppercase tracking-[0.24em] text-ivory/40">
                Opens external purchase page
              </p>
            </>
          )}
        </div>
      </div>
    </article>
  );
};
