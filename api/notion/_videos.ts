// Videos database normalisation + publication rules (server-side only).
import { resolvePublishInstant } from "./_schedule.js";
import { notionText } from "./_notionText.js";

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
  /** mm:ss / hh:mm:ss. Empty when Notion has no duration for the video. */
  duration: string;
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
 * Read a video duration as "m:ss" / "h:mm:ss". Accepts a Notion text/formula
 * value ("3:47", "PT3M47S") or a number of seconds. Returns "" when absent or
 * unparseable — VideoObject markup is then omitted rather than guessed.
 */
export function readDuration(prop: any): string {
  const fromNumber = typeof prop?.number === "number" ? prop.number : null;
  const raw = fromNumber !== null ? String(fromNumber) : notionText(prop).trim();
  if (!raw) return "";

  let seconds: number | null = null;
  if (/^\d+(\.\d+)?$/.test(raw)) {
    seconds = Math.round(Number(raw));
  } else if (/^PT/i.test(raw)) {
    const m = raw.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
    if (m && (m[1] || m[2] || m[3])) {
      seconds = Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0);
    }
  } else if (/^\d{1,2}(:\d{1,2}){1,2}$/.test(raw)) {
    const parts = raw.split(":").map((p) => Number.parseInt(p, 10));
    seconds = parts.length === 3
      ? parts[0] * 3600 + parts[1] * 60 + parts[2]
      : parts[0] * 60 + parts[1];
  }
  if (seconds === null || !Number.isFinite(seconds) || seconds <= 0) return "";

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}


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

// ---------------------------------------------------------------------------
//  Track → YouTube button selection (Media → Music page)
// ---------------------------------------------------------------------------

/** Only these Video Types may power a track's YouTube button, best first. */
export const TRACK_VIDEO_TYPE_PRIORITY = [
  "Official Music Video",
  "Official Audio",
  "Official Lyric Video",
] as const;

const normalizeType = (value: string) => value.normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();
const TYPE_RANK = new Map(
  TRACK_VIDEO_TYPE_PRIORITY.map((t, i) => [normalizeType(t), i] as const),
);

type Candidate = {
  rank: number;
  sortOrder: number;
  releaseInstant: number;
  id: string;
  url: string;
};

/**
 * Build a Map of Track page ID → canonical YouTube watch URL.
 *
 * Eligibility: Show on Website checked, valid YouTube URL, Release Date today
 * or earlier (Europe/London), and a supported Video Type. Selection is by type
 * priority, then lowest Sort Order, then most recent Release Date, then page ID
 * — fully deterministic for identical input.
 */
export function selectTrackYouTubeUrls(videoPages: any[], now: number): Map<string, string> {
  const best = new Map<string, Candidate>();

  for (const page of videoPages ?? []) {
    try {
      const props = page?.properties ?? {};
      if (findProp(props, "Show on Website", "Show On Website")?.checkbox !== true) continue;

      const youtubeId = extractYouTubeId(notionText(findProp(props, "YouTube URL")));
      if (!youtubeId) continue;

      const rank = TYPE_RANK.get(normalizeType(notionText(findProp(props, "Video Type"))));
      if (rank === undefined) continue;

      const releaseDate = findProp(props, "Release Date")?.date?.start ?? "";
      const instant = resolvePublishInstant(releaseDate);
      if (instant === null || instant > now) continue;

      const sortOrderProp = findProp(props, "Sort Order");
      const candidate: Candidate = {
        rank,
        sortOrder:
          typeof sortOrderProp?.number === "number" ? sortOrderProp.number : Number.POSITIVE_INFINITY,
        releaseInstant: instant,
        id: String(page?.id ?? ""),
        url: `https://www.youtube.com/watch?v=${youtubeId}`,
      };

      for (const trackId of relationIds(findProp(props, "Related Tracks"))) {
        const current = best.get(trackId);
        if (!current || isBetterCandidate(candidate, current)) best.set(trackId, candidate);
      }
    } catch {
      // A single malformed row must never break the lookup.
    }
  }

  return new Map([...best].map(([trackId, c]) => [trackId, c.url] as const));
}

function isBetterCandidate(a: Candidate, b: Candidate): boolean {
  if (a.rank !== b.rank) return a.rank < b.rank;
  if (a.sortOrder !== b.sortOrder) return a.sortOrder < b.sortOrder;
  if (a.releaseInstant !== b.releaseInstant) return a.releaseInstant > b.releaseInstant;
  return a.id < b.id;
}
