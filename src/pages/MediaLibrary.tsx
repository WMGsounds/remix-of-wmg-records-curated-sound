import { useMemo, useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Seo } from "@/components/Seo";
import { useReleases } from "@/lib/queries";
import { InlineSkeleton, PageError } from "@/components/UIStates";
import { LazyImage } from "@/components/LazyImage";

const SITE_ORIGIN = "https://www.wmgsounds.com";

const mediaUrlFor = (artistSlug: string, slug: string, origin: string) =>
  `${origin}/api/media/release/${encodeURIComponent(`${artistSlug}-${slug}`)}.jpg`;

const MediaLibrary = () => {
  const { data: releases, isLoading, isError } = useReleases();
  const [copied, setCopied] = useState<string | null>(null);

  const origin = useMemo(
    () => (typeof window !== "undefined" && window.location.origin ? window.location.origin : SITE_ORIGIN),
    [],
  );

  const items = useMemo(
    () => (releases ?? []).filter((r) => r.slug && r.coverArt),
    [releases],
  );

  const copy = async (key: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(key);
      window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
    } catch {
      setCopied(null);
    }
  };

  return (
    <>
      <Seo title="Media Library" description="Internal WMG artwork URL tool." noindex canonicalPath="/media-library" />

      <div className="mx-auto max-w-6xl px-6 pb-24 pt-28 md:pt-32">
        <h1 className="font-display text-3xl md:text-4xl text-ivory">Media Library</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ivory/60">
          Permanent direct artwork URLs for Genius and other music platforms. Each URL is stable and
          never expires — the image is generated on request from the Cover Art stored in Notion, so
          replacing the artwork in Notion updates the image at the same URL (within about an hour).
        </p>

        {isLoading && <InlineSkeleton />}
        {isError && <PageError />}

        {!isLoading && !isError && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((release) => {
              const url = mediaUrlFor(release.slug, origin);
              return (
                <article
                  key={release.id ?? release.slug}
                  className="flex flex-col rounded-lg border border-ivory/10 bg-ink/40 p-4"
                >
                  <div className="aspect-square w-full overflow-hidden rounded-md bg-ink/60">
                    <LazyImage
                      src={release.coverArt}
                      alt={`${release.title} cover art`}
                      width={600}
                      height={600}
                      displayWidth={400}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="mt-4 space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-ivory/45">
                      {release.artistName}
                      {release.releaseType ? ` · ${release.releaseType}` : ""}
                    </p>
                    <h2 className="font-display text-lg text-ivory">{release.title}</h2>
                  </div>

                  <p className="mt-3 break-all rounded border border-ivory/10 bg-ink/60 px-3 py-2 text-[11px] text-ivory/55">
                    {url}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copy(release.slug)}
                      className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-ink/40 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-ivory transition-colors hover:border-gold hover:text-gold"
                    >
                      {copied === release.slug ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied === release.slug ? "Copied" : "Copy Genius artwork URL"}
                    </button>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-2 rounded-full border border-ivory/20 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-ivory/70 transition-colors hover:border-ivory/50 hover:text-ivory"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open image
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default MediaLibrary;
