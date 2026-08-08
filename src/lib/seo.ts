// Central SEO constants and helpers for WMG (Wareham Music Group).
//
// SITE-WIDE TITLE + DESCRIPTION STANDARD — apply to every new page:
//
//  • Titles read descriptive-part-first, brand last:
//      "<Descriptive part> | Wareham Music Group"
//    Use the full brand name (not the "WMG" abbreviation, which is dominated
//    in search by Warner Music Group) unless the page has its own agreed
//    pattern (Journal posts use "| WMG Journal"). Target 50–60 characters;
//    `buildTitle()` trims the descriptive part at a word boundary to stay
//    within TITLE_MAX.
//  • Descriptions are complete sentences of roughly 150–155 characters.
//    Never ship an auto-truncated, ellipsis-terminated description:
//    `clampDescription()` cuts at a sentence end, or failing that at the last
//    whole word, and never appends an ellipsis.
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

const normalise = (s?: string | null): string =>
  (s || "").replace(/\s+/g, " ").replace(/[\s.…]*…\s*$/, "").trim();

/** Cut at the last whole word within `n` characters. Never appends an ellipsis. */
export const truncateWords = (s: string, n: number): string => {
  const t = normalise(s);
  if (t.length <= n) return t;
  const cut = t.slice(0, n);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:–—-]+$/, "");
};

/**
 * Meta/schema description: a complete sentence within `max` characters.
 * Prefers ending on sentence punctuation; otherwise falls back to the last
 * whole word. Never appends an ellipsis.
 */
export const clampDescription = (s?: string | null, max = DESCRIPTION_MAX): string => {
  const t = normalise(s);
  if (t.length <= max) return t;
  const window = t.slice(0, max);
  const sentenceEnd = Math.max(
    window.lastIndexOf(". "),
    window.lastIndexOf("! "),
    window.lastIndexOf("? "),
  );
  if (sentenceEnd > max * 0.5) return window.slice(0, sentenceEnd + 1).trim();
  if (/[.!?]$/.test(window)) return window.trim();
  return truncateWords(t, max);
};

/**
 * Compose a page title as "<descriptive part> | <brand>", trimming the
 * descriptive part at a word boundary so the whole title fits TITLE_MAX.
 */
export const buildTitle = (descriptive?: string | null, brand = BRAND_SUFFIX): string => {
  const head = normalise(descriptive);
  if (!head) return DEFAULT_TITLE;
  if (!brand) return truncateWords(head, TITLE_MAX);
  const room = TITLE_MAX - brand.length - 3; // " | "
  return `${truncateWords(head, Math.max(room, 20))} | ${brand}`;
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
