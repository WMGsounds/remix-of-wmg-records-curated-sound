// Videos database normalisation + publication rules (server-side only).
import { resolvePublishInstant } from "./_schedule.js";

export type VideoItem = {
  id: string;
  title: string;
  youtubeUrl: string;
  youtubeId: string;
  videoType: string;
  artists: { id: string; name: string; slug?: string }[];
  relatedTrackIds: string[];
  relatedReleaseIds: string[];
  releaseDate: string;
  description: string;
  featured: boolean;
  sortOrder: number | null;
};

const ID_RE = /^[A-Za-z0-9_-]{11}$/;

/** Extract an 11-char YouTube ID from watch / youtu.be / embed / shorts URLs. */
export function extractYouTubeId(raw?: string | null): string | null {
  if (!raw) return null;
  const value = String(raw).trim();
  if (!value) return null;
  if (ID_RE.test(value)) return value;

  let parsed: URL;
  try {
    parsed = new URL(value.startsWith("http") ? value : `https://${value}`);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  const isYouTube =
    host === "youtube.com"
    || host === "m.youtube.com"
    || host === "music.youtube.com"
    || host === "youtube-nocookie.com"
    || host === "youtu.be";
  if (!isYouTube) return null;

  const fromQuery = parsed.searchParams.get("v");
  if (fromQuery && ID_RE.test(fromQuery)) return fromQuery;

  const segments = parsed.pathname.split("/").filter(Boolean);
  if (host === "youtu.be") {
    const [id] = segments;
    return id && ID_RE.test(id) ? id : null;
  }
  const keyed = ["shorts", "embed", "v", "live"];
  for (let i = 0; i < segments.length; i++) {
    if (keyed.includes(segments[i].toLowerCase())) {
      const id = segments[i + 1];
      return id && ID_RE.test(id) ? id : null;
    }
  }
  return null;
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


const relationIds = (p: any): string[] =>
  Array.isArray(p?.relation) ? p.relation.map((r: any) => r?.id).filter(Boolean) : [];

/**
 * Normalise one Videos row. Returns null when the record must stay unpublished
 * (hidden, invalid/missing YouTube URL, or missing / future Release Date).
 */
export function normalizeVideo(
  page: any,
  artistLookup: Map<string, { id: string; name: string; slug?: string }>,
  now: number,
): VideoItem | null {
  const props = page?.properties ?? {};

  const showOnWebsiteProp = findProp(props, "Show on Website", "Show On Website");
  if (showOnWebsiteProp?.checkbox !== true) return null;

  const youtubeUrl = text(findProp(props, "YouTube URL"));
  const youtubeId = extractYouTubeId(youtubeUrl);
  if (!youtubeId) return null;

  const releaseDate = findProp(props, "Release Date")?.date?.start ?? "";
  if (!releaseDate) return null;
  const instant = resolvePublishInstant(releaseDate);
  if (instant === null || instant > now) return null;

  const artistIds = relationIds(findProp(props, "Artists", "Artist"));
  const artists = artistIds
    .map((id) => artistLookup.get(id))
    .filter(Boolean) as { id: string; name: string; slug?: string }[];

  const sortOrderProp = findProp(props, "Sort Order");
  const sortOrder = typeof sortOrderProp?.number === "number" ? sortOrderProp.number : null;

  return {
    id: page.id,
    title: text(findProp(props, "Video Title", "Title", "Name")),
    youtubeUrl,
    youtubeId,
    videoType: text(findProp(props, "Video Type")) || "Other",
    artists,
    relatedTrackIds: relationIds(findProp(props, "Related Tracks")),
    relatedReleaseIds: relationIds(findProp(props, "Related Release", "Related Releases")),
    releaseDate: releaseDate.slice(0, 10),
    description: text(findProp(props, "Description")),
    featured: findProp(props, "Featured")?.checkbox === true,
    sortOrder,
  };
}

/** Featured first, then explicit Sort Order, then newest, then title A–Z. */
export function sortVideos(videos: VideoItem[]): VideoItem[] {
  return [...videos].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    const ao = a.sortOrder ?? Number.POSITIVE_INFINITY;
    const bo = b.sortOrder ?? Number.POSITIVE_INFINITY;
    if (ao !== bo) return ao - bo;
    const ad = a.releaseDate ? Date.parse(a.releaseDate) : 0;
    const bd = b.releaseDate ? Date.parse(b.releaseDate) : 0;
    if (ad !== bd) return bd - ad;
    return a.title.localeCompare(b.title);
  });
}
