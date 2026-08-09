// Gallery Images normalisation + publication rules (server-side only).
import { resolvePublishInstant } from "./_schedule.js";
import { proxyImageIfNeeded } from "./_imageHelper.js";
import { slugifyName, keySegment, versionToken } from "./_mediaUrls.js";

export const GALLERY_IMAGE_TYPES = [
  "Portrait",
  "Live Performance",
  "Behind the Scenes",
  "Editorial",
  "Release Artwork",
  "WMG / Brand",
  "Other",
] as const;

/** SEO slug for a Gallery image title (lowercase, hyphenated, ASCII-safe). */
export const slugifyImageTitle = (raw: string): string => slugifyName(raw, "wmg-gallery-image");

/** Gallery ID normalised for use as a URL path segment (the real database key). */
export const galleryIdSegment = (galleryId: string): string => keySegment(galleryId);

/**
 * Permanent, descriptive public path for a Gallery image.
 * `/media/gallery/<gallery-id>/<image-title-slug>.webp` — the Gallery ID is the
 * key; the slug is purely descriptive, so retitled images keep resolving.
 * Version comes from File Hash, falling back to the page's last_edited_time.
 */
export function galleryPublicPath(galleryId: string, title: string, version = ""): string {
  const id = galleryIdSegment(galleryId);
  if (!id) return "";
  const v = versionToken(version);
  return `/media/gallery/${id}/${slugifyImageTitle(title)}.webp${v ? `?v=${v}` : ""}`;
}

const findProp = (props: Record<string, any>, ...names: string[]): any => {
  for (const n of names) if (props[n] !== undefined) return props[n];
  const norm = (s: string) => s.normalize("NFKC").replace(/\s+/g, "").toLowerCase();
  const targets = names.map(norm);
  for (const key of Object.keys(props)) {
    if (targets.includes(norm(key))) return props[key];
  }
  return undefined;
};

// Property → string reading lives in ./_notionText.ts (formulas are not rich text).
const text = notionText;


const bool = (p: any): boolean => p?.type === "checkbox" && p.checkbox === true;
const date = (p: any): string => p?.date?.start ?? "";
const numberOrNull = (p: any): number | null => {
  if (typeof p?.number === "number") return p.number;
  if (typeof p?.rollup?.number === "number") return p.rollup.number;
  if (typeof p?.formula?.number === "number") return p.formula.number;
  return null;
};

const rawFileUrl = (p: any): string => {
  const first = (p?.files ?? [])[0];
  if (!first) return "";
  const url = first.type === "external" ? first.external?.url : first.file?.url;
  return typeof url === "string" ? url.trim() : "";
};

const relationIds = (p: any): string[] =>
  Array.isArray(p?.relation) ? p.relation.map((r: any) => r?.id).filter(Boolean) : [];

const uniqueId = (p: any): string => {
  const u = p?.unique_id;
  if (u) return u.prefix ? `${u.prefix}-${u.number}` : String(u.number ?? "");
  // Rollup/formula mirrors of a unique-id property.
  if (Array.isArray(p?.rollup?.array)) {
    for (const entry of p.rollup.array) {
      const value = uniqueId(entry);
      if (value) return value;
    }
  }
  return text(p);
};

/** Raw (unproxied) Notion file URL for a Gallery page. */
export const galleryRawFileUrl = (page: any): string => rawFileUrl(findProp(page?.properties ?? {}, "Image"));

/** Gallery ID as stored on a Gallery page (before URL normalisation). */
export const galleryPageId = (page: any): string =>
  uniqueId(findProp(page?.properties ?? {}, "\u{1F504} Gallery ID", "Gallery ID")) || String(page?.id ?? "");

export type GalleryImage = {
  id: string;
  galleryId: string;
  title: string;
  imageUrl: string;
  publicUrl: string;
  imageSlug: string;
  width: number | null;
  height: number | null;
  aspectRatio: number | null;
  artistName: string;
  artistSlug: string;
  imageType: string;
  caption: string;
  altText: string;
  credit: string;
  imageDate: string;
  publishDate: string;
  featured: boolean;
  sortOrder: number | null;
  focalPoint: string;
  relatedRelease: string;
  relatedReleaseUrl: string;
  fileHash: string;
};

type ReleaseLookupEntry = { title: string; slug: string; published: boolean };

/**
 * Normalise a Gallery Images page. Returns null when the record can never be
 * shown publicly (hidden, no usable file, or a future Publish Date).
 * Publication rules are enforced here, on the server, and fail closed.
 */
export function normalizeGalleryImage(
  page: any,
  releaseLookup: Map<string, ReleaseLookupEntry> = new Map(),
  now: number = Date.now(),
): GalleryImage | null {
  const props = page?.properties ?? {};

  // 1. Master visibility switch — missing property means hidden (fail closed).
  const showProp = findProp(props, "Show on Website", "Show On Website");
  if (!bool(showProp)) return null;

  // 2. Usable image file.
  const raw = rawFileUrl(findProp(props, "Image"));
  if (!raw) return null;

  // 3. Scheduled publication (Europe/London, DST aware).
  const publishDate = date(findProp(props, "Publish Date"));
  if (publishDate) {
    const instant = resolvePublishInstant(publishDate);
    if (instant === null || instant > now) return null;
  }

  const width = numberOrNull(findProp(props, "Width"));
  const height = numberOrNull(findProp(props, "Height"));
  const title = text(findProp(props, "Image Title", "Title", "Name"));
  const caption = text(findProp(props, "Caption"));
  const artistName = text(findProp(props, "🔄 Artist Name", "Artist Name"));
  const imageType = text(findProp(props, "Image Type"));

  const releaseId = relationIds(findProp(props, "Related Release"))[0] ?? "";
  const release = releaseId ? releaseLookup.get(releaseId) : undefined;

  const altFallback =
    caption ||
    [artistName, title].filter(Boolean).join(" — ") ||
    title ||
    (imageType ? `${imageType} photograph` : "WMG gallery photograph");

  const galleryIdValue = uniqueId(findProp(props, "🔄 Gallery ID", "Gallery ID")) || String(page.id);
  const fileHash = text(findProp(props, "File Hash"));
  // File Hash is the preferred version token; last_edited_time keeps
  // cache-busting working for rows that don't populate it.
  const version = fileHash || String(page?.last_edited_time ?? "");

  return {
    id: String(page.id),
    galleryId: galleryIdValue,
    title,
    imageUrl: galleryPublicPath(galleryIdValue, title, version) || proxyImageIfNeeded(raw),
    publicUrl: galleryPublicPath(galleryIdValue, title, version),
    imageSlug: slugifyImageTitle(title),
    width: width && width > 0 ? width : null,
    height: height && height > 0 ? height : null,
    aspectRatio: width && height && width > 0 && height > 0 ? width / height : null,
    artistName,
    artistSlug: text(findProp(props, "🔄 Artist Slug", "Artist Slug")),
    imageType,
    caption,
    altText: text(findProp(props, "Alt Text")) || altFallback,
    credit: text(findProp(props, "Credit")),
    imageDate: date(findProp(props, "Image Date")),
    publishDate,
    featured: bool(findProp(props, "Featured")),
    sortOrder: numberOrNull(findProp(props, "Sort Order")),
    focalPoint: text(findProp(props, "Focal Point")) || "Centre",
    relatedRelease: release?.title ?? "",
    relatedReleaseUrl: release?.published && release.slug ? `/releases/${release.slug}` : "",
    fileHash,
  };
}

/** Deduplicate on Gallery ID, falling back to File Hash, then page id. */
export function dedupeGalleryImages(items: GalleryImage[]): GalleryImage[] {
  const seen = new Set<string>();
  const out: GalleryImage[] = [];
  for (const item of items) {
    const key = item.galleryId || item.fileHash || item.id;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** Stable default ordering: manual Sort Order first, then newest, then title. */
export function sortGalleryImages(items: GalleryImage[]): GalleryImage[] {
  return [...items].sort((a, b) => {
    const ao = a.sortOrder ?? Number.POSITIVE_INFINITY;
    const bo = b.sortOrder ?? Number.POSITIVE_INFINITY;
    if (ao !== bo) return ao - bo;
    const ad = a.imageDate ? Date.parse(a.imageDate) : 0;
    const bd = b.imageDate ? Date.parse(b.imageDate) : 0;
    if (ad !== bd) return bd - ad;
    return a.title.localeCompare(b.title);
  });
}
