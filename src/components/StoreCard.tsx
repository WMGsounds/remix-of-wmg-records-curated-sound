import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LazyImage } from "@/components/LazyImage";
import { useTracks, useReleases } from "@/lib/queries";
import type { StoreItem, StoreFormat, Track, Release } from "@/lib/types";

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
  const { data: allReleases = [] } = useReleases();
  const [tracksExpanded, setTracksExpanded] = useState(false);
  const [tracksOverflow, setTracksOverflow] = useState(false);
  const tracksScrollRef = useRef<HTMLOListElement | null>(null);

  const effectiveTracks = useMemo(() => {
    if (item.relatedTracks && item.relatedTracks.length > 0) {
      return item.relatedTracks.map((t, i) => ({
        id: t.id,
        title: t.title,
        trackNumber: i + 1,
      }));
    }
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

  const linkedReleaseShortDescription = useMemo(() => {
    if (variant !== "featured") return "";
    const rid = item.release?.id;
    const rslug = item.release?.slug;
    if (!rid && !rslug) return "";
    const match = (allReleases as Release[]).find(
      (r) => (rid && r.id === rid) || (rslug && r.slug === rslug),
    );
    return match?.shortDescription?.trim() ?? "";
  }, [variant, item.release, allReleases]);

  // Detect overflow in the collapsed (clamped) track list area.
  useLayoutEffect(() => {
    if (variant !== "featured") return;
    const el = tracksScrollRef.current;
    if (!el) return;
    const check = () => {
      setTracksOverflow(el.scrollHeight - el.clientHeight > 1);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    window.addEventListener("resize", check);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", check);
    };
  }, [variant, effectiveTracks, tracksExpanded]);

  if (item.availability === "Hidden") return null;

  const button = resolveButton(item);
  const orderedFormats = FORMAT_DISPLAY_ORDER.filter((f) => item.formats.includes(f));
  const formatLine = orderedFormats.join(" · ");
  const artistName = item.artist?.name ?? "WMG";
  const ariaLabel = `Buy ${item.title} by ${artistName}`;
  const isUnavailable = item.availability === "Coming Soon" || item.availability === "Sold Out";

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

  const PriceList = orderedFormats.length > 0 && (
    <dl className="flex w-full flex-col gap-2 text-[15px]">
      {orderedFormats.map((f) => {
        const raw = item.prices[f]?.trim();
        return (
          <div
            key={f}
            className="flex items-baseline justify-between gap-4 border-b border-ivory/10 pb-2"
          >
            <dt className="text-ivory/65">{f}</dt>
            <dd className={raw ? "text-ivory text-right" : "text-ivory/50 italic text-right"}>
              {raw || "See purchase page"}
            </dd>
          </div>
        );
      })}
    </dl>
  );

  const UnavailableCallout = (
    <div className="flex flex-1 items-center justify-center py-8">
      <div className="border border-gold/30 px-8 py-5 text-center">
        <p className="font-serif text-xl tracking-[0.08em] text-gold/85">
          {item.availability}
        </p>
      </div>
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

  const renderCTA = (ctaVariant: "featured" | "grid") => {
    if (button.disabled) {
      return (
        <button
          type="button"
          disabled
          aria-label={ariaLabel}
          className="block w-full cursor-not-allowed border border-ivory/15 px-6 py-3 text-center text-[11px] uppercase tracking-[0.24em] text-ivory/45"
        >
          {button.label}
        </button>
      );
    }
    return (
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
        <p
          className={`mt-2 text-[10px] uppercase tracking-[0.24em] text-ivory/40 ${ctaVariant === "featured" ? "text-left" : "text-center"}`}
        >
          Opens external purchase page
        </p>
      </>
    );
  };

  // ----- FEATURED VARIANT -----
  if (variant === "featured") {
    return (
      <article className="group grid grid-cols-1 overflow-hidden border border-gold/25 bg-ink/60 backdrop-blur-sm transition-all duration-500 hover:border-gold/55 hover:shadow-[0_30px_60px_-30px_hsl(var(--gold)/0.4)] md:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] md:items-stretch md:[container-type:inline-size]">
        <div className="relative aspect-square overflow-hidden bg-ink md:h-full">
          {item.productImage ? (
            <LazyImage
              src={item.productImage}
              alt={`${item.title} by ${artistName}`}
              width={1200}
              height={1200}
              displayWidth={640}
              sizes="(min-width: 768px) 40vw, 100vw"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-ink p-6 text-center text-ivory/50">
              Artwork coming soon.
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col p-8 md:p-10 md:max-h-[42cqw] md:overflow-hidden">
          {/* Top row: badges + helper line on the left, CTA on the right */}
          <div className="grid grid-cols-1 items-start gap-6 border-b border-ivory/10 pb-6 md:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] md:gap-x-10">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center border border-gold/50 bg-gold/5 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-gold">
                  Featured
                </span>
                <span
                  className={`inline-flex items-center border px-3 py-1 text-[10px] uppercase tracking-[0.24em] ${statusLabelClass(item.availability)}`}
                >
                  {item.availability}
                </span>
              </div>
              <p className="mt-4 text-[10px] uppercase tracking-[0.24em] text-ivory/55">
                Available on all major streaming platforms
              </p>
            </div>
            <div className="min-w-0">{renderCTA("featured")}</div>
          </div>

          {/* Body row: left text/prices/description | right track list */}
          <div className="mt-6 grid flex-1 min-h-0 grid-cols-1 gap-y-6 md:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] md:gap-x-10">
            <div className="flex min-w-0 flex-col gap-5">
              <header className="space-y-2">
                {ArtistLine}
                <h3 className="font-serif text-2xl leading-tight text-ivory md:text-3xl">
                  {item.title}
                </h3>
              </header>
              {!isUnavailable && orderedFormats.length > 0 && (
                <p className="text-xs uppercase tracking-[0.2em] text-ivory/65">
                  <span className="text-ivory/45">Available in: </span>
                  <span className="text-ivory/85">{formatLine}</span>
                </p>
              )}
              {!isUnavailable && PriceList}
              {!isUnavailable && linkedReleaseShortDescription && (
                <p className="mt-auto text-[15px] leading-relaxed text-ivory/70">
                  {linkedReleaseShortDescription}
                </p>
              )}
              {isUnavailable && UnavailableCallout}
            </div>

            <div className="flex min-w-0 min-h-0 flex-col">
              {!isUnavailable && effectiveTracks.length > 0 && (
                <>
                  <p className="mb-3 text-[11px] uppercase tracking-[0.24em] text-gold-soft">
                    Track list
                  </p>
                  <ol
                    ref={tracksScrollRef}
                    className={`min-h-0 flex-1 space-y-1.5 text-sm text-ivory/75 ${
                      tracksExpanded ? "overflow-visible" : "overflow-hidden"
                    }`}
                  >
                    {effectiveTracks.map((t, i) => (
                      <li key={t.id} className="flex items-baseline gap-3">
                        <span className="w-6 shrink-0 tabular-nums text-[11px] text-ivory/45">
                          {String(t.trackNumber || i + 1).padStart(2, "0")}
                        </span>
                        <span className="leading-snug">{t.title}</span>
                      </li>
                    ))}
                  </ol>
                  {(tracksOverflow || tracksExpanded) && (
                    <button
                      type="button"
                      onClick={() => setTracksExpanded((v) => !v)}
                      className="mt-3 inline-flex items-center gap-1.5 self-start text-[11px] uppercase tracking-[0.24em] text-gold/80 transition-colors hover:text-gold"
                    >
                      <span>{tracksExpanded ? "Show less" : "Show full track list"}</span>
                      <span aria-hidden>{tracksExpanded ? "▴" : "▾"}</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </article>
    );
  }

  // ----- GRID VARIANT -----
  const MetaRow = (
    <div className="flex min-h-[2.25rem] flex-wrap items-center gap-2 border-b border-ivory/10 pb-4">
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
      {!isUnavailable && item.displayPriceSummary && item.priceSummary && (
        <span className="ml-auto font-serif text-lg text-gold">{item.priceSummary}</span>
      )}
    </div>
  );

  return (
    <article className="group flex h-full flex-col border border-gold/15 bg-ink/60 backdrop-blur-sm transition-all duration-500 hover:border-gold/45 hover:shadow-[0_30px_60px_-30px_hsl(var(--gold)/0.35)]">
      <div className="relative aspect-square overflow-hidden bg-ink">
        {item.productImage ? (
          <LazyImage
            src={item.productImage}
            alt={`${item.title} by ${artistName}`}
            width={1200}
            height={1200}
            displayWidth={720}
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-ink p-6 text-center text-ivory/50">
            Artwork coming soon.
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-8 md:p-10">
        <div className="flex flex-col gap-6">
          {MetaRow}
          <header className="space-y-2">
            {ArtistLine}
            <h3
              className="font-serif text-2xl leading-tight text-ivory md:text-3xl line-clamp-2"
              style={{ minHeight: "calc(2 * 1.2em)" }}
            >
              {item.title}
            </h3>
          </header>
          {!isUnavailable && orderedFormats.length > 0 && (
            <p className="text-xs uppercase tracking-[0.2em] text-ivory/65">
              <span className="text-ivory/45">Available in: </span>
              <span className="text-ivory/85">{formatLine}</span>
            </p>
          )}
          {!isUnavailable && PriceList}
          {!isUnavailable && IncludesCollapsible}
          {isUnavailable && UnavailableCallout}
        </div>
        {!isUnavailable && <div className="mt-auto pt-6">{renderCTA("grid")}</div>}
      </div>
    </article>
  );
};
