/**
 * Single source of truth for which fields produced by `normalizeReleaseTrack`
 * are allowed to be dropped when a handler reshapes a release track into the
 * frontend `Track` shape.
 *
 * WHY THIS EXISTS
 * ---------------
 * `api/notion/release/[slug].ts` and `api/notion/artists.ts` both reshape release
 * tracks through an explicit field allowlist. That allowlist is deliberate (we do
 * not want raw Notion internals leaking into the client payload), but it means a
 * field added to the normaliser is silently dropped unless someone remembers to
 * add it to every reshape. That is exactly how `isrc` — and therefore `isrcCode`
 * in the MusicRecording JSON-LD — went missing on release pages while `/music`
 * had it.
 *
 * The guard: every key the normaliser emits must be listed below as either
 * PASSTHROUGH (must reach the reshaped Track) or OMITTED (deliberately internal).
 * `src/test/releaseTrackReshape.test.ts` enforces both halves:
 *   1. a new normaliser key that is in neither list fails the test, and
 *   2. a PASSTHROUGH key missing from either handler's reshape fails the test.
 * The type-level check at the bottom of this file additionally fails the build.
 *
 * Adding a field to `normalizeReleaseTrack` therefore forces a conscious decision
 * here, and forgetting a reshape is loud instead of a quietly incomplete page.
 */
import type { normalizeReleaseTrack } from "./_normalize.js";

export type NormalizedReleaseTrack = ReturnType<typeof normalizeReleaseTrack>;

/**
 * Normaliser keys that MUST be forwarded by every release-track reshape.
 * These feed the UI and/or the MusicRecording schema generators.
 */
export const RELEASE_TRACK_PASSTHROUGH = [
  "id",
  "releaseId",
  "trackNumber",
  "duration",
  "lyrics",
  "isrc",
  "spotifyUrl",
  "side",
  "versionLabel",
  "title",
  "youtubeOfficialAudio",
  "youtubeLyricVideo",
  "youtubeMusicVideo",
] as const;

/**
 * Normaliser keys deliberately NOT forwarded, each with the reason it is internal.
 * Anything listed here must be genuinely unused by the UI and by every schema
 * generator in `src/lib/schema.ts`.
 */
export const RELEASE_TRACK_OMITTED: Record<string, string> = {
  trackId: "Notion Tracks page id — internal join key, never rendered or emitted in JSON-LD.",
  displayTitle: "Folded into `title` by the normaliser; the reshape carries `title` only.",
};

export type ReleaseTrackPassthroughKey = (typeof RELEASE_TRACK_PASSTHROUGH)[number];

/**
 * Compile-time half of the guard. If a key is added to `normalizeReleaseTrack`
 * and to neither list above, `UnclassifiedReleaseTrackKey` stops being `never`
 * and this assignment fails the typecheck with the offending key name.
 */
type OmittedKey = "trackId" | "displayTitle";
type UnclassifiedReleaseTrackKey = Exclude<
  keyof NormalizedReleaseTrack,
  ReleaseTrackPassthroughKey | OmittedKey
>;
const _allReleaseTrackKeysClassified: UnclassifiedReleaseTrackKey extends never ? true : never = true;
void _allReleaseTrackKeysClassified;

/** Files whose release-track reshape must forward every PASSTHROUGH key. */
export const RELEASE_TRACK_RESHAPE_FILES = [
  "api/notion/release/[slug].ts",
  "api/notion/artists.ts",
] as const;
