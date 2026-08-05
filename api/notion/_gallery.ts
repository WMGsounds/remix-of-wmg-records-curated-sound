// Gallery Images normalisation + publication rules (server-side only).
import { resolvePublishInstant } from "./_schedule.js";
import { proxyImageIfNeeded } from "./_imageHelper.js";

export const GALLERY_IMAGE_TYPES = [
  "Portrait",
  "Live Performance",
  "Behind the Scenes",
  "Editorial",
  "Release Artwork",
  "WMG / Brand",
  "Other",
] as const;

const findProp = (props: Record<string, any>, ...names: string[]): any => {
  for (const n of names) if (props[n] !== undefined) return props[n];
  const norm = (s: string) => s.normalize("NFKC").replace(/\s+/g, "").toLowerCase();
  const targets = names.map(norm);
  for (const key of Object.keys(props)) {
    if (targets.includes(norm(key))) return props[key];
  }
  return undefined;
};

const plain = (items: any): string =>
  Array.isArray(items) ? items.map((t: any) => t?.plain_text ?? "").join("").trim() : "";

/** Text from title, rich_text, select, formula or rollup (including array rollups). */
const text = (p: any): string => {
  if (!p) return "";
  if (Array.isArray(p.title)) return plain(p.title);
  if (Array.isArray(p.rich_text)) return plain(p.rich_text);
  if (p.select?.name) return String(p.select.name).trim();
  if (typeof p.url === "string") return p.url.trim();
  if (typeof p.formula?.string === "string") return p.formula.string.trim();
  if (typeof p.rollup?.string === "string") return p.rollup.string.trim();
  if (typeof p.rollup?.number === "number") return String(p.rollup.number);
  if (Array.isArray(p.rollup?.array)) {
    for (const entry of p.rollup.array) {
      const value = text(entry);
      if (value) return value;
    }
  }
  if (typeof p.number === "number") return String(p.number);
  return "";
};

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
  if (!u) return "";
  return u.prefix ? `${u.prefix}-${u.number}` : String(u.number ?? "");
};

export type GalleryImage = {
  id: string;
  galleryId: string;
  title: string;
  imageUrl: string;
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
  const artistName = text(findProp(props, "Artist Name"));
  const imageType = text(findProp(props, "Image Type"));

  const releaseId = relationIds(findProp(props, "Related Release"))[0] ?? "";
  const release = releaseId ? releaseLookup.get(releaseId) : undefined;

  const altFallback =
    caption ||
    [artistName, title].filter(Boolean).join(" — ") ||
    title ||
    (imageType ? `${imageType} photograph` : "WMG gallery photograph");

  return {
    id: String(page.id),
    galleryId: uniqueId(findProp(props, "Gallery ID")) || String(page.id),
    title,
    imageUrl: proxyImageIfNeeded(raw),
    width: width && width > 0 ? width : null,
    height: height && height > 0 ? height : null,
    aspectRatio: width && height && width > 0 && height > 0 ? width / height : null,
    artistName,
    artistSlug: text(findProp(props, "Artist Slug")),
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
    fileHash: text(findProp(props, "File Hash")),
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
