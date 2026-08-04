import { describe, it, expect } from "vitest";
import {
  propertyText,
  stripExtension,
  normalizeCompositeKey,
  artistSlugMap,
  matchReleaseByCompositeKey,
  firstFileUrl,
  sanitizeFilename,
} from "../../api/notion/_media.js";

describe("propertyText", () => {
  it("reads rich_text and title", () => {
    expect(propertyText({ rich_text: [{ plain_text: "heaven " }, { plain_text: "in" }] })).toBe("heaven in");
    expect(propertyText({ title: [{ plain_text: " Betty Blane " }] })).toBe("Betty Blane");
  });
  it("reads formula, number, url and select", () => {
    expect(propertyText({ formula: { string: " betty-blane " } })).toBe("betty-blane");
    expect(propertyText({ formula: { number: 12 } })).toBe("12");
    expect(propertyText({ number: 7 })).toBe("7");
    expect(propertyText({ url: " https://x.test " })).toBe("https://x.test");
    expect(propertyText({ select: { name: "vinyl" } })).toBe("vinyl");
  });
  it("returns empty for unknown shapes", () => {
    expect(propertyText(undefined)).toBe("");
    expect(propertyText({ checkbox: true })).toBe("");
  });
});

describe("key normalisation", () => {
  it("strips known extensions only", () => {
    expect(stripExtension("a-b.jpg")).toBe("a-b");
    expect(stripExtension("a-b.JPEG")).toBe("a-b");
    expect(stripExtension("a-b.mp3")).toBe("a-b.mp3");
  });
  it("decodes and lowercases", () => {
    expect(normalizeCompositeKey("Betty%20Blane-Heaven.JPG")).toBe("betty blane-heaven");
  });
});

const artistPages = [
  { id: "a1", properties: { Slug: { rich_text: [{ plain_text: "betty-blane" }] } } },
  { id: "a2", properties: { Slug: { formula: { string: "no-cover-artist" } } } },
];
const releasePages = [
  {
    id: "r1",
    properties: {
      Slug: { rich_text: [{ plain_text: "heaven-in-your-arms" }] },
      Artist: { relation: [{ id: "a1" }] },
    },
  },
  {
    id: "r2",
    properties: {
      Slug: { rich_text: [{ plain_text: "other-song" }] },
      Artist: { relation: [] },
    },
  },
];

describe("matchReleaseByCompositeKey", () => {
  const artists = artistSlugMap(artistPages);

  it("maps artist page ids to slugs", () => {
    expect(artists.get("a1")).toBe("betty-blane");
    expect(artists.get("a2")).toBe("no-cover-artist");
  });

  it("matches the full composite key without splitting hyphens", () => {
    const m = matchReleaseByCompositeKey(releasePages, artists, "betty-blane-heaven-in-your-arms.jpg");
    expect(m.reason).toBe("match");
    expect(m.page?.id).toBe("r1");
  });

  it("is case-insensitive", () => {
    expect(
      matchReleaseByCompositeKey(releasePages, artists, "Betty-Blane-Heaven-In-Your-Arms").page?.id,
    ).toBe("r1");
  });

  it("reports not_found for unknown keys", () => {
    expect(matchReleaseByCompositeKey(releasePages, artists, "nope-nope").reason).toBe("not_found");
  });

  it("reports missing_artist_slug when the release has no linked artist", () => {
    expect(matchReleaseByCompositeKey(releasePages, artists, "other-song").reason).toBe(
      "missing_artist_slug",
    );
  });
});

describe("file helpers", () => {
  it("picks the first usable file url", () => {
    expect(firstFileUrl({ files: [{ type: "file", file: { url: "https://a/1.png" } }] })).toBe("https://a/1.png");
    expect(firstFileUrl({ files: [{ type: "external", external: { url: "https://b/2.png" } }] })).toBe("https://b/2.png");
    expect(firstFileUrl({ files: [] })).toBe("");
  });
  it("sanitises filenames", () => {
    expect(sanitizeFilename("betty blane/heaven")).toBe("betty-blane-heaven");
    expect(sanitizeFilename("///")).toBe("artwork");
  });
});
