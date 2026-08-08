// ---------------------------------------------------------------------------
// Permanent, descriptive public media URLs for every Notion-sourced image.
//
// Shape:  /media/<kind>/<stable-key>/<descriptive-slug>.webp?v=<version>
//
// The stable key (artist slug, artist-release composite key, store key,
// journal slug + block id, gallery id) is what resolves the Notion record.
// The trailing slug is descriptive only, so renaming a record in Notion never
// resolves the wrong image and old links keep working.
//
// Underscore-prefixed so Vercel never deploys it as a serverless function.
// ---------------------------------------------------------------------------

/** Lowercase, transliterated, hyphenated, collision-safe slug. */
export function slugifyName(raw: string, fallback = "wmg-image"): string {
  const slug = (raw ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['\u2018\u2019\u201b`]/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  // Keep filenames sane; hard limit avoids absurd URLs from long titles.
  return (slug.length > 120 ? slug.slice(0, 120).replace(/-$/, "") : slug) || fallback;
}

/** URL-safe path segment for a key that must resolve a record (never renamed). */
export const keySegment = (raw: string): string =>
  (raw ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Notion UUID without dashes — used as a stable block/page key in URLs. */
export const compactId = (raw: string): string =>
  (raw ?? "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Cache-busting version token. Derived from `last_edited_time` (changes when
 * the image is replaced), formatted `20260808T103000Z`. Never the expiring
 * Notion S3 signature.
 */
export function versionToken(isoOrHash: string): string {
  const raw = (isoOrHash ?? "").trim();
  if (!raw) return "";
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (iso) return `${iso[1]}${iso[2]}${iso[3]}T${iso[4]}${iso[5]}${iso[6]}Z`;
  return raw.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16);
}

const withVersion = (path: string, version: string): string => {
  const v = versionToken(version);
  return v ? `${path}?v=${v}` : path;
};

export type ArtistImageRole = "hero" | "secondary" | "gallery";

/**
 * /media/artists/<artist-slug>/hero/<artist>-hero.webp
 * /media/artists/<artist-slug>/secondary/<artist>-secondary-image.webp
 * /media/artists/<artist-slug>/gallery/<index>/<artist>-gallery-image-01.webp
 */
export function artistImageUrl(opts: {
  artistSlug: string;
  artistName: string;
  role: ArtistImageRole;
  index?: number;
  version?: string;
}): string {
  const key = keySegment(opts.artistSlug);
  if (!key) return "";
  const name = slugifyName(opts.artistName, "wmg-artist");
  if (opts.role === "gallery") {
    const i = Math.max(0, opts.index ?? 0);
    const padded = String(i + 1).padStart(2, "0");
    return withVersion(
      `/media/artists/${key}/gallery/${i}/${name}-gallery-image-${padded}.webp`,
      opts.version ?? "",
    );
  }
  const suffix = opts.role === "hero" ? "hero" : "secondary-image";
  return withVersion(`/media/artists/${key}/${opts.role}/${name}-${suffix}.webp`, opts.version ?? "");
}

/** Composite release key `[artist-slug]-[release-slug]` — matches the legacy JPEG route. */
export const releaseKey = (artistSlug: string, releaseSlug: string): string => {
  const a = keySegment(artistSlug);
  const r = keySegment(releaseSlug);
  if (!r) return "";
  return a ? `${a}-${r}` : r;
};

/** /media/releases/<artist-slug>-<release-slug>/<artist>-<release>-cover-art.webp */
export function releaseArtworkUrl(opts: {
  artistSlug: string;
  releaseSlug: string;
  artistName: string;
  releaseTitle: string;
  version?: string;
}): string {
  const key = releaseKey(opts.artistSlug, opts.releaseSlug);
  if (!key) return "";
  const name = slugifyName(
    [opts.artistName, opts.releaseTitle].filter(Boolean).join(" ") || opts.releaseTitle,
    "wmg-release",
  );
  return withVersion(`/media/releases/${key}/${name}-cover-art.webp`, opts.version ?? "");
}

/** /media/store/<store-key>/<artist>-<product-title>.webp */
export function storeImageUrl(opts: {
  storeKey: string;
  title: string;
  artistName?: string;
  version?: string;
}): string {
  const key = keySegment(opts.storeKey) || compactId(opts.storeKey);
  if (!key) return "";
  const name = slugifyName(
    [opts.artistName, opts.title].filter(Boolean).join(" ") || opts.title,
    "wmg-store-item",
  );
  return withVersion(`/media/store/${key}/${name}.webp`, opts.version ?? "");
}

/** /media/journal/<article-slug>/cover/<article-title>.webp */
export function journalCoverUrl(opts: { articleSlug: string; title: string; version?: string }): string {
  const key = keySegment(opts.articleSlug) || compactId(opts.articleSlug);
  if (!key) return "";
  return withVersion(
    `/media/journal/${key}/cover/${slugifyName(opts.title, "wmg-journal-article")}.webp`,
    opts.version ?? "",
  );
}

/** /media/journal/<article-slug>/images/<block-id>/<caption-or-title-index>.webp */
export function journalBlockImageUrl(opts: {
  articleSlug: string;
  blockId: string;
  caption?: string;
  articleTitle?: string;
  index?: number;
  version?: string;
}): string {
  const key = keySegment(opts.articleSlug) || compactId(opts.articleSlug);
  const block = compactId(opts.blockId);
  if (!key || !block) return "";
  const padded = String(Math.max(0, opts.index ?? 0) + 1).padStart(2, "0");
  const descriptive = (opts.caption ?? "").trim()
    ? slugifyName(opts.caption ?? "", "wmg-journal-image")
    : slugifyName(
        `${opts.articleTitle ?? "wmg journal"} image ${padded}`,
        `wmg-journal-image-${padded}`,
      );
  return withVersion(`/media/journal/${key}/images/${block}/${descriptive}.webp`, opts.version ?? "");
}

/** Strip the `?v=` token so a public media URL can be compared or re-versioned. */
export const stripVersion = (url: string): string => (url ?? "").split("?")[0];

/** True for any of our permanent same-domain media URLs. */
export const isPublicMediaUrl = (url: string): boolean => (url ?? "").startsWith("/media/");
