// Central SEO constants and helpers for WMG (Wareham Music Group).
export const SITE_URL = "https://www.wmgsounds.com";
export const SITE_NAME = "WMG";
export const SITE_LEGAL_NAME = "Wareham Music Group";
export const DEFAULT_TITLE = "WMG | Wareham Music Group";
export const DEFAULT_DESCRIPTION =
  "WMG is an independent label curating artist worlds and story-led releases across soul, blues, country, crooner and cinematic music.";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.jpg`;
export const LOGO_URL = `${SITE_URL}/wmg-logo.png`;

export const absoluteUrl = (path = "/"): string => {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

export const truncate = (s: string, n = 158): string => {
  const t = (s || "").replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  return t.slice(0, n - 1).trimEnd() + "…";
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
