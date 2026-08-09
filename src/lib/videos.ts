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
  /** mm:ss / hh:mm:ss; "" when Notion has no duration for this video. */
  duration?: string;
  featured: boolean;
  sortOrder: number | null;
};

/** Video Type values supported by the Notion Videos database. */
export const VIDEO_TYPES = [
  "Official Audio",
  "Official Lyric Video",
  "Official Music Video",
  "Full Album",
  "Compilation",
  "Live Performance",
  "Interview",
  "Other",
] as const;
export type VideoType = (typeof VIDEO_TYPES)[number];

/** Comma-joined artist names for display. */
export const artistNames = (v: VideoItem): string => v.artists.map((a) => a.name).join(", ");

const ID_RE = /^[A-Za-z0-9_-]{11}$/;

/**
 * Extract an 11-character YouTube video ID from any common YouTube URL shape.
 * Returns null for anything that isn't a valid YouTube video link.
 */
export const extractYouTubeId = (raw?: string | null): string | null => {
  if (!raw) return null;
  const value = raw.trim();
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
};

export const thumbnailUrl = (videoId: string) => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
export const embedUrl = (videoId: string) =>
  `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
export const watchUrl = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`;
