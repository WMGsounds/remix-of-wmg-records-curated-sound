// Central SEO constants and helpers for WMG (Wareham Music Group).
//
// SITE-WIDE TITLE + DESCRIPTION STANDARD — apply to every new page:
//
//  • Titles read descriptive-part-first, brand last:
//      "<Descriptive part> | Wareham Music Group"
//    Use the full brand name (not the "WMG" abbreviation, which is dominated
//    in search by Warner Music Group) unless the page has its own agreed
//    pattern (Journal posts use "| WMG Journal"). Target 50–60 characters.
//  • Descriptions are complete sentences of roughly 150–155 characters,
//    authored to length and used verbatim.
//
// All length-limiting goes through the single implementation in
// src/lib/truncate.ts (`truncateAtWord`), which is a fallback for bad input,
// not a content strategy. Do not add another truncation helper here.
import { truncateAtWord } from "./truncate";
import {
  SITE_URL,
  SITE_NAME,
  SITE_LEGAL_NAME,
  LOGO_URL,
  SITE_LANGUAGE,
  absoluteUrl,
} from "./schema";

// Canonical origin, names and the one absoluteUrl() helper live in schema.ts so
// that every URL — in head tags and in JSON-LD — passes through one gate.
export { SITE_URL, SITE_NAME, SITE_LEGAL_NAME, LOGO_URL, SITE_LANGUAGE, absoluteUrl };

/** Brand suffix used at the end of page titles. */
export const BRAND_SUFFIX = "Wareham Music Group";
/** Brand suffix for Journal articles. */
export const JOURNAL_BRAND_SUFFIX = "WMG Journal";
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;
export const DEFAULT_TITLE = "Independent Record Label, London | Wareham Music Group";
export const DEFAULT_DESCRIPTION =
  "Wareham Music Group is an independent London label with story-led releases across soul, blues, country, crooner and cinematic music.";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.jpg`;


/** Whole-word cut. Thin alias of the one shared implementation. */
export const truncateWords = (s: string, n: number): string => truncateAtWord(s, n);

/**
 * Meta/schema description fallback: never mid-word, never an ellipsis.
 * Authored descriptions are already within DESCRIPTION_MAX and pass through
 * untouched.
 */
export const clampDescription = (s?: string | null, max = DESCRIPTION_MAX): string =>
  truncateAtWord(s, max);

/**
 * Compose "<descriptive part> | <brand>".
 *
 * NO TRUNCATION. A title longer than TITLE_MAX is not an error: Google reads
 * the whole tag and only truncates the display. Clipping in code is what turns
 * a usable title into a broken one ("… Do Not Publish by | Wareham Music
 * Group"), so we never cut mid-phrase and never leave a trailing connective.
 *
 * `fallbackDescriptive` is an optional shorter, still-grammatical variant
 * (e.g. the release title without " by <artist>"). It is used only when the
 * full title exceeds TITLE_MAX.
 */
export const buildTitle = (
  descriptive?: string | null,
  brand = BRAND_SUFFIX,
  fallbackDescriptive?: string | null,
): string => {
  const head = (descriptive || "").replace(/\s+/g, " ").trim();
  if (!head) return DEFAULT_TITLE;
  const compose = (d: string) => (brand ? `${d} | ${brand}` : d);
  const full = compose(head);
  if (full.length <= TITLE_MAX) return full;
  const alt = (fallbackDescriptive || "").replace(/\s+/g, " ").trim();
  if (alt && alt !== head) {
    const shorter = compose(alt);
    if (shorter.length < full.length) return shorter;
  }
  return full;
};
// JSON-LD construction lives ONLY in src/lib/schema.ts. Nothing here builds
// structured data; import the generators from there instead.

