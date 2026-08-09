// CENTRAL SEO CONFIGURATION — the only place page metadata is authored.
//
// Rule 1 of the WMG standing SEO rules: no per-page SEO code. Every page gets
// its title, description, canonical, OG/Twitter tags, breadcrumb trail and
// ImageObject nodes from this file via <Seo route="…" />. To add a page type,
// add a key here and a matching entry in routeRegistry.ts — never hand-write
// meta tags or breadcrumbs inside a page component.
//
// DESCRIPTIONS: authored strings below are used verbatim. `clampDescription`
// is applied ONLY where a description is derived from body copy (artist bios,
// release blurbs, article excerpts) — never to an authored string.

import {
  BRAND_SUFFIX,
  JOURNAL_BRAND_SUFFIX,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  clampDescription,
} from "./seo";

export type BreadcrumbTrail = { name: string; path: string }[];

/** Everything <Seo> needs to render a head. */
export type SeoMeta = {
  /** Descriptive part only; the brand suffix is appended. */
  title?: string;
  /** Exact title string, used as-is. */
  fullTitle?: string;
  brand?: string;
  description: string;
  canonicalPath: string;
  canonicalUrl?: string;
  image?: string;
  type?: "website" | "article" | "music.album";
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  breadcrumb?: BreadcrumbTrail;
  /** Organization + WebSite nodes (homepage only). */
  siteSchemas?: boolean;
};

const HOME: BreadcrumbTrail = [{ name: "Home", path: "/" }];
const trail = (...rest: BreadcrumbTrail): BreadcrumbTrail => [...HOME, ...rest];

/* ------------------------------------------------------------------ *
 * Static hub pages — authored titles and descriptions.
 * ------------------------------------------------------------------ */

const staticPages = {
  home: {
    fullTitle: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    canonicalPath: "/",
    siteSchemas: true,
  },
  artists: {
    fullTitle: "Our Artists: Soul, Blues, Country and Reggae | WMG",
    description:
      "Explore the WMG artist roster, from classic soul and blues-soul to crooner, country-soul, Americana and cinematic music worlds.",
    canonicalPath: "/artists",
    breadcrumb: trail({ name: "Artists", path: "/artists" }),
  },
  releases: {
    fullTitle: "All Releases: Singles, EPs and Albums | WMG",
    description:
      "Browse the WMG catalogue, including singles, double singles and albums from Betty Blane, Bobby Chills, Tony Medley, Jack Rivers and more.",
    canonicalPath: "/releases",
    breadcrumb: trail({ name: "Releases", path: "/releases" }),
  },
  journal: {
    fullTitle: "WMG Journal: Release Stories and Artist Features",
    description:
      "Read WMG Journal stories, including release stories, artist spotlights, album features and behind-the-scenes editorial from Wareham Music Group.",
    canonicalPath: "/journal",
    breadcrumb: trail({ name: "Journal", path: "/journal" }),
  },
  store: {
    fullTitle: "Buy Vinyl, CD and Digital | Wareham Music Group",
    description:
      "Buy WMG releases on vinyl, CD and digital. Limited editions, bundles and signed copies from Wareham Music Group artists.",
    canonicalPath: "/store",
    breadcrumb: trail({ name: "Store", path: "/store" }),
  },
  gallery: {
    fullTitle: "Artist Photography and Artwork | Wareham Music Group",
    description:
      "The WMG visual archive: portraits, live performance, studio sessions and behind-the-scenes photography from across the Wareham Music Group roster.",
    canonicalPath: "/gallery",
    breadcrumb: trail({ name: "Gallery", path: "/gallery" }),
  },
  videos: {
    fullTitle: "Official Music Videos and Lyric Videos | WMG",
    description:
      "Official music videos, lyric videos and official audio from across the Wareham Music Group roster.",
    canonicalPath: "/videos",
    breadcrumb: trail({ name: "Videos", path: "/videos" }),
  },
  music: {
    fullTitle: "Listen to the WMG Catalogue | Soul, Blues, Reggae",
    description:
      "Explore the Wareham Music Group catalogue. Discover tracks by WMG artists, stream on major platforms, read song stories and explore the full lyrics.",
    canonicalPath: "/music",
    breadcrumb: trail({ name: "Music", path: "/music" }),
  },
  about: {
    fullTitle: "About Wareham Music Group, London Independent Label",
    description:
      "WMG (Wareham Music Group) is a London-based independent label building catalogue with patience, restraint and respect for the song.",
    canonicalPath: "/about",
    breadcrumb: trail({ name: "About", path: "/about" }),
  },
  contact: {
    fullTitle: "Contact WMG: Press, Sync and Demo Submissions",
    description:
      "Get in touch with WMG — for press, sync and licensing, artist demos, or general enquiries.",
    canonicalPath: "/contact",
    breadcrumb: trail({ name: "Contact", path: "/contact" }),
  },
  newsletter: {
    title: "Newsletter: New Releases and First Access",
    description:
      "Join the WMG list for new releases, limited editions and first access — sent rarely, only when there's something worth saying.",
    canonicalPath: "/newsletter",
    breadcrumb: trail({ name: "Newsletter", path: "/newsletter" }),
  },
  spotify: {
    fullTitle: "Spotify | Wareham Music Group",
    description: "Follow Wareham Music Group on Spotify.",
    canonicalPath: "/spotify",
    noindex: true,
  },
  seoDiagnostics: {
    title: "SEO Diagnostics",
    description: "Internal SEO diagnostics for WMG public routes.",
    canonicalPath: "/seo-diagnostics",
    noindex: true,
  },
  mediaLibrary: {
    title: "Media Library",
    description: "Internal WMG artwork URL tool.",
    canonicalPath: "/media-library",
    noindex: true,
  },
  notFound: {
    title: "Page not found",
    description: "The page you were looking for could not be found on WMG.",
    canonicalPath: "/404",
    noindex: true,
  },
} satisfies Record<string, Partial<SeoMeta> & { canonicalPath: string; description: string }>;

export type StaticSeoKey = keyof typeof staticPages;

/* ------------------------------------------------------------------ *
 * Legal documents — copy lives here so page, routes and sitemap agree.
 * ------------------------------------------------------------------ */

export const LEGAL_DOCS: Record<
  string,
  { title: string; description: string; body: string[] }
> = {
  privacy: {
    title: "Privacy Policy",
    description:
      "How Wareham Music Group collects, uses and protects information submitted through this website.",
    body: [
      "This Privacy Policy describes how Wareham Music Group ('WMG', 'we', 'our') collects, uses and protects information you provide when using this website.",
      "We collect only the minimum information required to operate the site and our services, including email addresses submitted to our newsletter and messages submitted via our contact form.",
      "We do not sell your personal data. For any privacy enquiry, contact privacy@wmgsounds.com.",
    ],
  },
  terms: {
    title: "Terms of Use",
    description:
      "Terms governing use of the WMG website, including content rights and acceptable use.",
    body: [
      "By accessing this website you agree to these Terms of Use. All content on this site, including images, audio, video and text, is the property of Wareham Music Group or its licensors and is protected by copyright.",
      "You may not reproduce, distribute or commercially exploit any material from this site without prior written consent.",
    ],
  },
  cookies: {
    title: "Cookies",
    description: "Information about how WMG uses cookies on this website.",
    body: [
      "This site uses a small number of essential cookies to operate properly. Optional analytics cookies may be used to help us understand how the site is used. You can control cookies through your browser settings.",
    ],
  },
};

/* ------------------------------------------------------------------ *
 * Dynamic page metadata builders.
 * ------------------------------------------------------------------ */

type ArtistLike = {
  name: string;
  slug: string;
  genre?: string;
  shortDescription?: string;
  heroImage?: string;
};

type ReleaseLike = {
  title: string;
  slug: string;
  artistName?: string;
  releaseType?: string;
  shortDescription?: string;
  fullDescription?: string;
  coverArt?: string;
};

type JournalLike = {
  title: string;
  slug: string;
  seoTitle?: string;
  seoDescription?: string;
  excerpt?: string;
  summary?: string;
  coverImage?: string;
  canonicalUrl?: string;
  noindex?: boolean;
  published?: boolean;
  publishedDate?: string;
  lastEditedTime?: string;
};

const dynamicPages = {
  artist: (a: ArtistLike): SeoMeta => {
    const path = `/artists/${a.slug}`;
    return {
      title: a.genre ? `${a.name}, ${a.genre} Artist` : `${a.name}, Recording Artist`,
      // Derived from the artist bio → clamped.
      description: clampDescription(
        a.shortDescription
          ? `${a.name} — ${a.shortDescription} Explore releases, stories and music from ${a.name} on WMG.`
          : `${a.name} on WMG. Explore releases, stories and music from ${a.name}.`,
      ),
      canonicalPath: path,
      image: a.heroImage,
      breadcrumb: trail({ name: "Artists", path: "/artists" }, { name: a.name, path }),
    };
  },

  release: (r: ReleaseLike): SeoMeta => {
    const path = `/releases/${r.slug}`;
    const artistName = r.artistName || "Wareham Music Group";
    return {
      title: `${r.title} by ${artistName}`,
      // Derived from release body copy → clamped.
      description: clampDescription(
        r.shortDescription || r.fullDescription
          ? `${r.shortDescription || r.fullDescription}`
          : `Listen to ${r.title} by ${r.artistName || ""}, a ${r.releaseType} release from Wareham Music Group.`,
      ),
      canonicalPath: path,
      image: r.coverArt,
      type: "music.album",
      breadcrumb: trail({ name: "Releases", path: "/releases" }, { name: r.title, path }),
    };
  },

  journalArticle: (a: JournalLike): SeoMeta => {
    const path = `/journal/${a.slug}`;
    return {
      title: (a.seoTitle || a.title).replace(/\s*\|\s*WMG.*$/, ""),
      brand: JOURNAL_BRAND_SUFFIX,
      // Derived from the article body/excerpt → clamped.
      description: clampDescription(a.seoDescription || a.excerpt || a.summary || ""),
      canonicalPath: path,
      canonicalUrl: a.canonicalUrl || undefined,
      image: a.coverImage,
      type: "article",
      noindex: a.noindex || !a.published,
      publishedTime: a.publishedDate || undefined,
      modifiedTime: a.lastEditedTime || undefined,
      breadcrumb: trail(
        { name: "Journal", path: "/journal" },
        { name: a.title, path },
      ),
    };
  },

  journalCategory: (c: { name: string; slug: string }): SeoMeta => {
    const path = `/journal/category/${c.slug}`;
    const name = c.name || "Category";
    return {
      title: `${name} Stories`,
      brand: JOURNAL_BRAND_SUFFIX,
      description: `${c.name} stories from WMG — release notes, artist features and label editorial from Wareham Music Group.`,
      canonicalPath: path,
      breadcrumb: trail(
        { name: "Journal", path: "/journal" },
        { name: c.name || "Category", path },
      ),
    };
  },

  legal: (doc: string): SeoMeta => {
    const key = doc in LEGAL_DOCS ? doc : "privacy";
    const page = LEGAL_DOCS[key];
    const path = `/legal/${key}`;
    return {
      title: page.title,
      description: page.description,
      canonicalPath: path,
      breadcrumb: trail({ name: page.title, path }),
    };
  },
};

export type DynamicSeoKey = keyof typeof dynamicPages;
export type SeoKey = StaticSeoKey | DynamicSeoKey;

export const SEO_CONFIG = {
  ...staticPages,
  ...dynamicPages,
} as Record<SeoKey, SeoMeta | ((data: never) => SeoMeta)>;

export const seoKeys = Object.keys(SEO_CONFIG) as SeoKey[];

/** Static page metadata by key (throws in dev if the key is dynamic). */
export const staticSeo = (key: StaticSeoKey): SeoMeta =>
  ({ brand: BRAND_SUFFIX, type: "website", ...(staticPages[key] as SeoMeta) });

/** Metadata for a dynamic page type. */
export const seoFor = dynamicPages;
