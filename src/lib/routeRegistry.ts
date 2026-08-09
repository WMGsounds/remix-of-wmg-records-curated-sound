// SINGLE SOURCE OF TRUTH FOR ROUTES.
//
// Rule 2 of the WMG standing SEO rules: every route is pre-rendered, and the
// pre-render/sitemap lists are generated from this registry plus CMS content —
// never hand-maintained. `src/routes.tsx` builds the React Router table from
// this file, `entry-server.tsx` expands it into concrete URLs, and
// `scripts/prerender.mjs` writes both the static HTML and sitemap.xml from
// that same expansion. Adding a page means adding one entry here (and its
// matching key in seoConfig.ts) — nothing else.

import type { SeoKey } from "./seoConfig";
import { LEGAL_DOCS } from "./seoConfig";

export type PageName =
  | "Index"
  | "Artists"
  | "ArtistPage"
  | "Releases"
  | "ReleasePage"
  | "Gallery"
  | "Videos"
  | "Music"
  | "Journal"
  | "JournalCategory"
  | "JournalArticlePage"
  | "Store"
  
  | "About"
  | "Contact"
  | "Newsletter"
  | "Legal"
  | "SeoDiagnostics"
  | "MediaLibrary"
  | "NotFound";

/** A concrete, crawlable URL produced by expanding a registry entry. */
export type ResolvedRoute = {
  path: string;
  seo: SeoKey;
  /** ISO date of the last meaningful content change, when one is known. */
  lastmod?: string;
};

/** Minimal shape of the CMS content needed to expand dynamic routes. */
export type RouteContent = {
  artists: { slug: string }[];
  releases: { slug: string; releaseDate?: string }[];
  journal: { slug: string; category?: string; lastEditedTime?: string; publishedDate?: string }[];
};

export type RouteEntry = {
  /** React Router path pattern. */
  path: string;
  page: PageName;
  seo: SeoKey;
  /** Emit static HTML at build time. Default true. */
  prerender?: boolean;
  /** List in sitemap.xml. Default = prerender. */
  sitemap?: boolean;
  /** Expand a dynamic pattern into concrete URLs. */
  expand?: (content: RouteContent) => ResolvedRoute[];
};

export const slugify = (s: string): string =>
  (s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const journalCategories = (content: RouteContent): string[] => {
  const set = new Set<string>();
  for (const a of content.journal) if (a.category) set.add(slugify(a.category));
  return [...set].filter(Boolean);
};

/**
 * Most recent article date within a journal category, used as the category
 * page's lastmod. Category listings genuinely change whenever a new article
 * lands in them, so this is an accurate signal (unlike a build date).
 */
export const journalCategoryLastmod = (
  content: RouteContent,
  categorySlug: string,
): string | undefined => {
  const dates = content.journal
    .filter((a) => a.category && slugify(a.category) === categorySlug)
    .map((a) => a.lastEditedTime || a.publishedDate)
    .filter((d): d is string => Boolean(d))
    .sort();
  return dates.length ? dates[dates.length - 1] : undefined;
};


export const routeRegistry: RouteEntry[] = [
  { path: "/", page: "Index", seo: "home" },
  { path: "/artists", page: "Artists", seo: "artists" },
  {
    path: "/artists/:slug",
    page: "ArtistPage",
    seo: "artist",
    expand: (c) => c.artists.map((a) => ({ path: `/artists/${a.slug}`, seo: "artist" as SeoKey })),
  },
  { path: "/releases", page: "Releases", seo: "releases" },
  {
    path: "/releases/:slug",
    page: "ReleasePage",
    seo: "release",
    expand: (c) =>
      c.releases.map((r) => ({
        path: `/releases/${r.slug}`,
        seo: "release" as SeoKey,
        lastmod: r.releaseDate,
      })),
  },
  { path: "/gallery", page: "Gallery", seo: "gallery" },
  { path: "/videos", page: "Videos", seo: "videos" },
  { path: "/music", page: "Music", seo: "music" },
  { path: "/journal", page: "Journal", seo: "journal" },
  {
    path: "/journal/category/:slug",
    page: "JournalCategory",
    seo: "journalCategory",
    expand: (c) =>
      journalCategories(c).map((slug) => ({
        path: `/journal/category/${slug}`,
        seo: "journalCategory" as SeoKey,
        lastmod: journalCategoryLastmod(c, slug),
      })),
  },
  {
    path: "/journal/:slug",
    page: "JournalArticlePage",
    seo: "journalArticle",
    expand: (c) =>
      c.journal.map((a) => ({
        path: `/journal/${a.slug}`,
        seo: "journalArticle" as SeoKey,
        lastmod: a.lastEditedTime || a.publishedDate,
      })),
  },
  { path: "/store", page: "Store", seo: "store" },
  // /spotify is a pure edge 301 (vercel.json). No route, no component.

  { path: "/about", page: "About", seo: "about" },
  { path: "/contact", page: "Contact", seo: "contact" },
  { path: "/newsletter", page: "Newsletter", seo: "newsletter" },
  {
    path: "/legal/:doc",
    page: "Legal",
    seo: "legal",
    expand: () =>
      Object.keys(LEGAL_DOCS).map((doc) => ({ path: `/legal/${doc}`, seo: "legal" as SeoKey })),
  },
  // Internal tools: never pre-rendered, never indexed, never in the sitemap.
  { path: "/seo-diagnostics", page: "SeoDiagnostics", seo: "seoDiagnostics", prerender: false },
  { path: "/media-library", page: "MediaLibrary", seo: "mediaLibrary", prerender: false },
  { path: "*", page: "NotFound", seo: "notFound", prerender: false },
];

const isPrerendered = (e: RouteEntry) => e.prerender !== false;
const inSitemap = (e: RouteEntry) => (e.sitemap ?? isPrerendered(e)) && isPrerendered(e);

/** Every concrete URL that must exist as pre-rendered HTML. */
export const resolveRoutes = (content: RouteContent): ResolvedRoute[] => {
  const out: ResolvedRoute[] = [];
  for (const entry of routeRegistry) {
    if (!isPrerendered(entry)) continue;
    if (entry.expand) out.push(...entry.expand(content));
    else out.push({ path: entry.path, seo: entry.seo });
  }
  const seen = new Set<string>();
  return out.filter((r) => Boolean(r.path) && !seen.has(r.path) && seen.add(r.path));
};

/** Concrete URLs that belong in sitemap.xml (a subset of resolveRoutes). */
export const resolveSitemapRoutes = (content: RouteContent): ResolvedRoute[] => {
  const allowed = new Set(
    routeRegistry.filter(inSitemap).flatMap((entry) =>
      entry.expand ? entry.expand(content).map((r) => r.path) : [entry.path],
    ),
  );
  return resolveRoutes(content).filter((r) => allowed.has(r.path));
};
