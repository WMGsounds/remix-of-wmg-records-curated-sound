import { useMemo } from "react";
import { Link } from "react-router-dom";
import { LazyImage } from "@/components/LazyImage";
import { useTracks } from "@/lib/queries";
import type { StoreItem, StoreFormat, Track } from "@/lib/types";

const FORMAT_DISPLAY_ORDER: StoreFormat[] = ["Vinyl", "CD", "iTunes", "Digital", "Merch", "Other"];

type ButtonState = {
  disabled: boolean;
  label: string;
  href?: string;
};

const DEFAULT_BUY_LABEL = "Buy this release";
const LEGACY_DEFAULT_LABEL = "view purchase options";

function resolveButton(item: StoreItem): ButtonState {
  switch (item.availability) {
    case "Available Now":
      if (item.purchaseLink) {
        const override = item.buttonText?.trim();
        const label =
          override && override.toLowerCase() !== LEGACY_DEFAULT_LABEL
            ? override
            : DEFAULT_BUY_LABEL;
        return { disabled: false, label, href: item.purchaseLink };
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

type StoreCardProps = {
  item: StoreItem;
  variant?: "grid" | "featured";
};

export const StoreCard = ({ item, variant = "grid" }: StoreCardProps) => {
  const { data: allTracks = [] } = useTracks();

  const effectiveTracks = useMemo(() => {
    // Prefer the Store item's own Related Tracks if Notion provides them.
    if (item.relatedTracks && item.relatedTracks.length > 0) {
      return item.relatedTracks.map((t, i) => ({
        id: t.id,
        title: t.title,
        trackNumber: i + 1,
      }));
    }
    // Fall back to the linked Release's tracklist (same source as Release pages).
    const releaseId = item.release?.id;
    const releaseSlug = item.release?.slug;
    if (!releaseId && !releaseSlug) return [];
    return (allTracks as Track[])
      .filter(
        (t) =>
          (releaseId && t.releaseId === releaseId) ||
          (releaseSlug && t.releaseSlug === releaseSlug),
      )
      .slice()
      .sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0))
      .map((t) => ({
        id: t.id,
        title: t.trackTitle,
        trackNumber: t.trackNumber || 0,
      }));
  }, [item.relatedTracks, item.release, allTracks]);

  if (item.availability === "Hidden") return null;

  const button = resolveButton(item);
  const orderedFormats = FORMAT_DISPLAY_ORDER.filter((f) => item.formats.includes(f));
  const formatLine = orderedFormats.join(" · ");
  const artistName = item.artist?.name ?? "WMG";
  const ariaLabel = `Buy ${item.title} by ${artistName}`;

  const MetaRow = (
    <div className="flex min-h-[2.25rem] flex-wrap items-center gap-2 border-b border-ivory/10 pb-4">
      {variant === "featured" && (
        <span className="inline-flex items-center border border-gold/50 bg-gold/5 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-gold">
          Featured
        </span>
      )}
      <span
        className={`inline-flex items-center border px-3 py-1 text-[10px] uppercase tracking-[0.24em] ${statusLabelClass(item.availability)}`}
      >
        {item.availability}
      </span>
      {variant !== "featured" && item.featured && (
        <span className="inline-flex items-center border border-gold/40 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-gold">
          Featured
        </span>
      )}
      {item.displayPriceSummary && item.priceSummary && (
        <span className="ml-auto font-serif text-lg text-gold">{item.priceSummary}</span>
      )}
    </div>
  );

  const PriceList = orderedFormats.length > 0 && (
    <dl className="flex flex-col gap-2 text-[15px]">
      {orderedFormats.map((f) => {
        const raw = item.prices[f]?.trim();
        return (
          <div
            key={f}
            className="flex items-baseline gap-4 border-b border-ivory/10 pb-2"
          >
            <dt className="min-w-[3.5rem] text-ivory/65">{f}</dt>
            <dd className={raw ? "text-ivory" : "text-ivory/50 italic"}>
              {raw || "See purchase page"}
            </dd>
          </div>
        );
      })}
    </dl>
  );

  const TrackList = effectiveTracks.length > 0 && (
    <div className="space-y-3">
      <p className="text-[11px] uppercase tracking-[0.24em] text-gold-soft">Track list</p>
      <ol className="space-y-1.5 text-sm text-ivory/75">
        {effectiveTracks.map((t, i) => (
          <li key={t.id} className="flex items-baseline gap-3">
            <span className="w-6 shrink-0 tabular-nums text-[11px] text-ivory/45">
              {String(t.trackNumber || i + 1).padStart(2, "0")}
            </span>
            <span className="leading-snug">{t.title}</span>
          </li>
        ))}
      </ol>
    </div>
  );

  const IncludesCollapsible = effectiveTracks.length > 0 && (
    <details className="group/inc text-sm">
      <summary className="cursor-pointer list-none text-[11px] uppercase tracking-[0.24em] text-ivory/55 hover:text-ivory">
        Includes ({effectiveTracks.length})
        <span className="ml-2 text-ivory/40 group-open/inc:hidden">+</span>
        <span className="ml-2 hidden text-ivory/40 group-open/inc:inline">−</span>
      </summary>
      <ul className="mt-3 space-y-1 text-ivory/70">
        {effectiveTracks.map((t) => (
          <li key={t.id} className="text-sm">
            {t.title}
          </li>
        ))}
      </ul>
    </details>
  );

  const ArtistLine = (
    <div className="min-h-[1.25rem]">
      {item.artist &&
        (item.artist.slug ? (
          <Link
            to={`/artists/${encodeURIComponent(item.artist.slug)}`}
            className="eyebrow text-gold inline-block transition-colors hover:text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            {item.artist.name}
          </Link>
        ) : (
          <p className="eyebrow text-gold">{item.artist.name}</p>
        ))}
    </div>
  );

  const ButtonBlock = (
    <div className="mt-auto pt-6">
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
  );

  if (variant === "featured") {
    return (
      <article className="group grid grid-cols-1 overflow-hidden border border-gold/25 bg-ink/60 backdrop-blur-sm transition-all duration-500 hover:border-gold/55 hover:shadow-[0_30px_60px_-30px_hsl(var(--gold)/0.4)] md:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)]">
        <div className="relative aspect-square overflow-hidden bg-muted md:aspect-auto md:min-h-[340px]">
          {item.productImage ? (
            <LazyImage
              src={item.productImage}
              alt={`${item.title} by ${artistName}`}
              width={1200}
              height={1200}
              displayWidth={640}
              sizes="(min-width: 768px) 40vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center p-6 text-center text-ivory/50">
              Artwork coming soon.
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-8 md:p-10">
          <div className="flex flex-col gap-6">
            {MetaRow}
            <header className="space-y-2">
              {ArtistLine}
              <h3 className="font-serif text-2xl leading-tight text-ivory md:text-3xl">{item.title}</h3>
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
            <div className={`grid gap-8 ${effectiveTracks.length > 0 ? "md:grid-cols-2" : "grid-cols-1"}`}>
              <div>{PriceList}</div>
              {effectiveTracks.length > 0 && <div>{TrackList}</div>}
            </div>
          </div>
          {ButtonBlock}
        </div>
      </article>
    );
  }

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
      <div className="flex flex-1 flex-col p-8 md:p-10">
        <div className="flex flex-col gap-6">
          {MetaRow}
          <header className="space-y-2">
            {ArtistLine}
            <h3 className="min-h-[4rem] font-serif text-2xl leading-tight text-ivory md:min-h-[4.5rem] md:text-3xl">
              {item.title}
            </h3>
          </header>
          {item.description && (
            <p className="line-clamp-3 text-[15px] leading-relaxed text-ivory/70">{item.description}</p>
          )}
          {orderedFormats.length > 0 && (
            <p className="text-xs uppercase tracking-[0.2em] text-ivory/65">
              <span className="text-ivory/45">Available in: </span>
              <span className="text-ivory/85">{formatLine}</span>
            </p>
          )}
          {PriceList}
          {IncludesCollapsible}
        </div>
        {ButtonBlock}
      </div>
    </article>
  );
};
