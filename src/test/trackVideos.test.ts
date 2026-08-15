import { describe, it, expect } from "vitest";
import { selectTrackYouTubeUrls } from "../../api/notion/_videos.js";

const DAY = 86_400_000;
const NOW = Date.parse("2026-08-09T12:00:00Z");
const iso = (offsetDays: number) => new Date(NOW + offsetDays * DAY).toISOString().slice(0, 10);

type Opts = {
  id: string;
  type: string;
  videoId?: string;
  tracks?: string[];
  show?: boolean;
  date?: string;
  sortOrder?: number | null;
  url?: string;
};

const video = ({
  id,
  type,
  videoId = "abcdefghijk",
  tracks = ["track-1"],
  show = true,
  date = iso(-5),
  sortOrder = null,
  url,
}: Opts) => ({
  id,
  properties: {
    "Show on Website": { checkbox: show },
    "YouTube URL": { url: url ?? (videoId ? `https://www.youtube.com/watch?v=${videoId}` : "") },
    "Video Type": { select: { name: type } },
    "Release Date": { date: date ? { start: date } : null },
    "Sort Order": { number: sortOrder },
    "Related Tracks": { relation: tracks.map((t) => ({ id: t })) },
  },
});

const pick = (pages: unknown[]) => selectTrackYouTubeUrls(pages as any[], NOW).get("track-1");

describe("selectTrackYouTubeUrls", () => {
  it("prefers Official Music Video over both other supported types", () => {
    const pages = [
      video({ id: "a", type: "Official Audio", videoId: "AUDIOxxxxxx" }),
      video({ id: "b", type: "Official Lyric Video", videoId: "LYRICxxxxxx" }),
      video({ id: "c", type: "Official Music Video", videoId: "MUSICxxxxxx" }),
    ];
    expect(pick(pages)).toBe("https://www.youtube.com/watch?v=MUSICxxxxxx");
  });

  it("falls back to Official Audio when no Official Music Video exists", () => {
    const pages = [
      video({ id: "b", type: "Official Lyric Video", videoId: "LYRICxxxxxx" }),
      video({ id: "a", type: "Official Audio", videoId: "AUDIOxxxxxx" }),
    ];
    expect(pick(pages)).toBe("https://www.youtube.com/watch?v=AUDIOxxxxxx");
  });

  it("uses Official Lyric Video only when nothing higher ranked is eligible", () => {
    expect(pick([video({ id: "b", type: "Official Lyric Video", videoId: "LYRICxxxxxx" })])).toBe(
      "https://www.youtube.com/watch?v=LYRICxxxxxx",
    );
  });

  it("ignores hidden, future-dated, undated, unrelated and URL-less videos", () => {
    const pages = [
      video({ id: "hidden", type: "Official Music Video", show: false }),
      video({ id: "future", type: "Official Music Video", date: iso(5) }),
      video({ id: "undated", type: "Official Music Video", date: "" }),
      video({ id: "other-track", type: "Official Music Video", tracks: ["track-2"] }),
      video({ id: "nourl", type: "Official Music Video", url: "" }),
      video({ id: "badurl", type: "Official Music Video", url: "https://vimeo.com/1234" }),
    ];
    expect(pick(pages)).toBeUndefined();
  });

  it("ignores unsupported video types", () => {
    const pages = ["Full Album", "Compilation", "Live Performance", "Interview", "Other", "Bootleg"].map(
      (type, i) => video({ id: `v${i}`, type }),
    );
    expect(pick(pages)).toBeUndefined();
  });

  it("breaks ties by sort order, then newest date, then page id", () => {
    const sortOrderWins = [
      video({ id: "z", type: "Official Music Video", videoId: "SORT2xxxxxx", sortOrder: 2 }),
      video({ id: "a", type: "Official Music Video", videoId: "SORT1xxxxxx", sortOrder: 1 }),
    ];
    expect(pick(sortOrderWins)).toBe("https://www.youtube.com/watch?v=SORT1xxxxxx");

    const dateWins = [
      video({ id: "a", type: "Official Music Video", videoId: "OLDvidxxxxx", date: iso(-30) }),
      video({ id: "z", type: "Official Music Video", videoId: "NEWvidxxxxx", date: iso(-1) }),
    ];
    expect(pick(dateWins)).toBe("https://www.youtube.com/watch?v=NEWvidxxxxx");

    const idWins = [
      video({ id: "zzz", type: "Official Music Video", videoId: "ZZZvidxxxxx" }),
      video({ id: "aaa", type: "Official Music Video", videoId: "AAAvidxxxxx" }),
    ];
    expect(pick(idWins)).toBe("https://www.youtube.com/watch?v=AAAvidxxxxx");
    expect(pick([...idWins].reverse())).toBe("https://www.youtube.com/watch?v=AAAvidxxxxx");
  });

  it("maps every related track and tolerates malformed rows", () => {
    const map = selectTrackYouTubeUrls(
      [null, {}, video({ id: "a", type: "Official Audio", tracks: ["track-1", "track-2"] })] as any[],
      NOW,
    );
    expect(map.get("track-1")).toBe("https://www.youtube.com/watch?v=abcdefghijk");
    expect(map.get("track-2")).toBe("https://www.youtube.com/watch?v=abcdefghijk");
    expect(map.size).toBe(2);
  });
});

describe("one-day publication delay", () => {
  it("hides a video released today and shows one released yesterday", () => {
    expect(pick([video({ id: "today", type: "Official Music Video", date: iso(0) })])).toBeUndefined();
    expect(pick([video({ id: "yday", type: "Official Music Video", date: iso(-1) })])).toBe(
      "https://www.youtube.com/watch?v=abcdefghijk",
    );
  });
});
