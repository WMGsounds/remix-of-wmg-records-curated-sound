import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { normalizeReleaseTrack } from "../../api/notion/_normalize";
import {
  RELEASE_TRACK_PASSTHROUGH,
  RELEASE_TRACK_OMITTED,
  RELEASE_TRACK_RESHAPE_FILES,
} from "../../api/notion/_releaseTrackFields";

/**
 * Guard against the silent-drop failure mode of the reshape allowlists:
 * a field added to `normalizeReleaseTrack` that nobody wires into
 * `api/notion/release/[slug].ts` / `api/notion/artists.ts` produces an
 * incomplete page (missing lyrics, missing isrcCode in JSON-LD) with no error.
 * Here it produces a failing test instead. Do not "fix" a failure by deleting
 * assertions — classify the new field in `_releaseTrackFields.ts` and forward it.
 */

const fakeReleaseTrackPage = () => ({
  id: "rt-1",
  properties: {
    Name: { type: "title", title: [{ plain_text: "Song" }] },
    Release: { type: "relation", relation: [{ id: "rel-1" }] },
    Track: { type: "relation", relation: [{ id: "trk-1" }] },
    "Track Number": { type: "number", number: 1 },
  },
});

const fakeTrackPage = {
  id: "trk-1",
  properties: {
    "Track Title": { type: "title", title: [{ plain_text: "Song" }] },
    Duration: { type: "rich_text", rich_text: [{ plain_text: "3:21" }] },
    ISRC: { type: "rich_text", rich_text: [{ plain_text: "GBXXX0000001" }] },
  },
};

const normalizedKeys = () =>
  Object.keys(
    normalizeReleaseTrack(fakeReleaseTrackPage(), new Map([[fakeTrackPage.id, fakeTrackPage]])),
  );

describe("release track reshape allowlist", () => {
  it("classifies every key the normaliser emits as passthrough or deliberately omitted", () => {
    const classified = new Set<string>([
      ...RELEASE_TRACK_PASSTHROUGH,
      ...Object.keys(RELEASE_TRACK_OMITTED),
    ]);
    const unclassified = normalizedKeys().filter((k) => !classified.has(k));
    expect(
      unclassified,
      `normalizeReleaseTrack emits field(s) not classified in api/notion/_releaseTrackFields.ts: ${unclassified.join(", ")}. ` +
        "Add each to RELEASE_TRACK_PASSTHROUGH (and forward it in every reshape) or to RELEASE_TRACK_OMITTED with a reason.",
    ).toEqual([]);
  });

  it("lists no stale field that the normaliser no longer emits", () => {
    const emitted = new Set(normalizedKeys());
    const stale = [...RELEASE_TRACK_PASSTHROUGH, ...Object.keys(RELEASE_TRACK_OMITTED)].filter(
      (k) => !emitted.has(k),
    );
    expect(stale, `Stale field(s) in _releaseTrackFields.ts: ${stale.join(", ")}`).toEqual([]);
  });

  it.each(RELEASE_TRACK_RESHAPE_FILES)("%s forwards every passthrough field", (file) => {
    const source = readFileSync(resolve(process.cwd(), file), "utf8");
    const missing = RELEASE_TRACK_PASSTHROUGH.filter(
      (key) => !new RegExp(`\\brt\\.${key}\\b`).test(source),
    );
    expect(
      missing,
      `${file} never reads rt.${missing.join(", rt.")} — the reshape drops it, so the page/JSON-LD will be silently incomplete.`,
    ).toEqual([]);
  });
});
