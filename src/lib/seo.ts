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

export const SITE_URL = "https://www.wmgsounds.com";
export const SITE_NAME = "WMG";
export const SITE_LEGAL_NAME = "Wareham Music Group";
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
export const LOGO_URL = `${SITE_URL}/wmg-logo.png`;

export const absoluteUrl = (path = "/"): string => {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

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
 * Compose a page title as "<descriptive part> | <brand>", trimming the
 * descriptive part at a word boundary so the whole title fits TITLE_MAX.
 */
export const buildTitle = (descriptive?: string | null, brand = BRAND_SUFFIX): string => {
  const head = truncateAtWord(descriptive, 500);
  if (!head) return DEFAULT_TITLE;
  if (!brand) return truncateAtWord(head, TITLE_MAX);
  const room = TITLE_MAX - brand.length - 3; // " | "
  return `${truncateAtWord(head, Math.max(room, 20))} | ${brand}`;
};



export const organizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  alternateName: SITE_LEGAL_NAME,
  url: SITE_URL,
  logo: LOGO_URL,
  address: {
    "@type": "PostalAddress",
    addressLocality: "London",
    addressCountry: "GB",
  },
});

export const websiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
});

export const breadcrumbSchema = (
  trail: { name: string; path: string }[],
) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: trail.map((t, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: t.name,
    item: absoluteUrl(t.path),
  })),
});

/**
 * ImageObject node for a permanent WMG media URL (relative paths are made
 * absolute). Returns null when there's no image, so callers can filter.
 */
export const imageObjectSchema = (opts: {
  url?: string | null;
  name?: string | null;
  description?: string | null;
  caption?: string | null;
  credit?: string | null;
}) => {
  const url = (opts.url ?? "").trim();
  if (!url) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    contentUrl: absoluteUrl(url),
    ...(opts.name ? { name: opts.name } : {}),
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.caption ? { caption: opts.caption } : {}),
    ...(opts.credit ? { creditText: opts.credit } : {}),
  };
};
