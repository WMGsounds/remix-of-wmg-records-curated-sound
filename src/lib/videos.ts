import type { Track } from "./types";

export type VideoType = "Official Music Video" | "Official Lyric Video" | "Official Audio";

export type VideoItem = {
  id: string;
  trackId: string;
  trackTitle: string;
  artistName: string;
  artistSlug: string;
  releaseTitle: string;
  releaseSlug: string;
  releaseDate: string;
  url: string;
  videoId: string;
  type: VideoType;
};

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

// Highest priority first — used to collapse duplicate video IDs.
const SOURCES: { key: keyof Track; suffix: string; type: VideoType }[] = [
  { key: "youtubeMusicVideo", suffix: "omv", type: "Official Music Video" },
  { key: "youtubeLyricVideo", suffix: "olv", type: "Official Lyric Video" },
  { key: "youtubeOfficialAudio", suffix: "oa", type: "Official Audio" },
];

/** Derive up to three video entries per track, skipping invalid/empty links. */
export const buildVideoItems = (tracks: Track[]): VideoItem[] => {
  const seen = new Set<string>();
  const items: VideoItem[] = [];

  tracks.forEach((track) => {
    SOURCES.forEach(({ key, suffix, type }) => {
      const raw = track[key] as string | null | undefined;
      const videoId = extractYouTubeId(raw);
      if (!videoId) return;
      if (seen.has(videoId)) {
        if (import.meta.env.DEV) {
          console.warn(`[videos] duplicate YouTube ID ${videoId} skipped for "${track.trackTitle}"`);
        }
        return;
      }
      seen.add(videoId);
      items.push({
        id: `${track.id}-${suffix}`,
        trackId: track.id,
        trackTitle: track.trackTitle,
        artistName: track.artistName ?? "",
        artistSlug: track.artistSlug ?? "",
        releaseTitle: track.releaseTitle ?? "",
        releaseSlug: track.releaseSlug ?? "",
        releaseDate: track.releaseDate ?? "",
        url: (raw as string).trim(),
        videoId,
        type,
      });
    });
  });

  return items;
};
