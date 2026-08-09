// THE ONLY PLACE JSON-LD IS CONSTRUCTED.
//
// One generator per content type. Pages never build schema inline — they call
// `schemaFor(type, item)` (or a named generator) and pass the result to <Seo>.
// A content type with no generator THROWS, so a new page type fails the
// pre-render build loudly instead of silently shipping with no structured data.
//
// Every URL that enters any schema goes through `absoluteUrl()`, which prefixes
// the canonical origin and strips query strings (including ?v= cache-busters),
// so relative URLs and cache-busting parameters cannot reappear.

/* ------------------------------------------------------------------ *
 * Canonical site constants (re-exported by src/lib/seo.ts).
 * ------------------------------------------------------------------ */

export const SITE_URL = "https://www.wmgsounds.com";
export const SITE_NAME = "WMG";
export const SITE_LEGAL_NAME = "Wareham Music Group";
export const LOGO_URL = `${SITE_URL}/wmg-logo.png`;
/** Matches og:locale (en_GB) and <html lang="en-GB">. */
export const SITE_LANGUAGE = "en-GB";
export const ORG_EMAIL = "info@wmgsounds.com";
export const ORG_GENRES = ["Soul", "R&B", "Blues", "Reggae", "Country"];

/**
 * Direct, canonical external profile URLs. sameAs is an identity assertion that
 * search engines verify against the profile itself, so these must never be
 * replaced with vanity redirects on our own domain. Facebook and Apple Music
 * profiles do not exist yet — they get appended here when they do.
 */
export const ORG_SAME_AS = [
  "https://www.instagram.com/warehammusicgroup/",
  "https://www.youtube.com/@WMGsounds",
  "https://open.spotify.com/user/315vlgpfq47hf6pebgugkm6rbgxq",
];

/* ------------------------------------------------------------------ *
 * URL helper — the single gate every schema URL passes through.
 * ------------------------------------------------------------------ */

/** Absolute, query-free URL. Relative paths are resolved against SITE_URL. */
export const absoluteUrl = (path?: string | null): string => {
  const raw = (path ?? "").trim();
  if (!raw) return SITE_URL;
  const noQuery = raw.split("?")[0].split("#")[0];
  if (!noQuery) return SITE_URL;
  if (/^https?:\/\//i.test(noQuery)) return noQuery;
  return `${SITE_URL}${noQuery.startsWith("/") ? noQuery : `/${noQuery}`}`;
};

/** Absolute URL or undefined — for optional properties. */
const url = (v?: string | null): string | undefined => {
  const raw = (v ?? "").trim();
  return raw ? absoluteUrl(raw) : undefined;
};

/** Build a sameAs array from candidate URLs; undefined when nothing is left. */
const sameAsList = (candidates: (string | null | undefined)[]): string[] | undefined => {
  const list = candidates
    .map((c) => (c ?? "").trim())
    .filter(Boolean)
    .map((c) => absoluteUrl(c))
    .filter((c) => c !== SITE_URL);
  const unique = Array.from(new Set(list));
  return unique.length ? unique : undefined;
};

/** "3:47" → "PT3M47S". Returns undefined for anything unparseable. */
export const isoDuration = (value?: string | null): string | undefined => {
  const raw = (value ?? "").trim();
  if (!raw) return undefined;
  const parts = raw.split(":").map((p) => Number.parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) return undefined;
  let h = 0, m = 0, s = 0;
  if (parts.length === 3) [h, m, s] = parts;
  else if (parts.length === 2) [m, s] = parts;
  else return undefined;
  const total = h * 3600 + m * 60 + s;
  if (!total) return undefined;
  return `PT${Math.floor(total / 3600) ? `${Math.floor(total / 3600)}H` : ""}${
    Math.floor((total % 3600) / 60) ? `${Math.floor((total % 3600) / 60)}M` : ""
  }${total % 60 ? `${total % 60}S` : ""}`;
};

const secondsOf = (value?: string | null): number => {
  const parts = (value ?? "").split(":").map((p) => Number.parseInt(p, 10));
  if (!parts.length || parts.some((n) => Number.isNaN(n))) return 0;
  return parts.length === 3
    ? parts[0] * 3600 + parts[1] * 60 + parts[2]
    : parts.length === 2
      ? parts[0] * 60 + parts[1]
      : 0;
};

const secondsToIso = (total: number): string | undefined => {
  if (!total) return undefined;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}${s ? `${s}S` : ""}`;
};

const ctx = { "@context": "https://schema.org" } as const;
type Node = Record<string, unknown>;

/* ------------------------------------------------------------------ *
 * Site-level schemas — emitted ONCE from the root layout.
 * ------------------------------------------------------------------ */

export const organization = (): Node => ({
  ...ctx,
  "@type": "Organization",
  name: SITE_NAME,
  // Distinguishes WMG from Warner Music Group — must never be dropped.
  alternateName: SITE_LEGAL_NAME,
  url: absoluteUrl("/"),
  logo: absoluteUrl(LOGO_URL),
  email: ORG_EMAIL,
  genre: ORG_GENRES,
  sameAs: ORG_SAME_AS.map((s) => absoluteUrl(s)),
  address: {
    "@type": "PostalAddress",
    addressLocality: "London",
    addressCountry: "GB",
  },
});

/**
 * WebSite. Deliberately no potentialAction/SearchAction: Google retired the
 * Sitelinks Search Box on 21 November 2024, so it produces no rich result.
 */
export const website = (): Node => ({
  ...ctx,
  "@type": "WebSite",
  name: SITE_NAME,
  url: absoluteUrl("/"),
  inLanguage: SITE_LANGUAGE,
  publisher: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
});

/* ------------------------------------------------------------------ *
 * Generic generators.
 * ------------------------------------------------------------------ */

export const breadcrumbList = (trail: { name: string; path: string }[]): Node => ({
  ...ctx,
  "@type": "BreadcrumbList",
  itemListElement: trail.map((t, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: t.name,
    item: absoluteUrl(t.path),
  })),
});

export const imageObject = (opts: {
  url?: string | null;
  name?: string | null;
  description?: string | null;
  caption?: string | null;
  credit?: string | null;
}): Node | null => {
  const contentUrl = url(opts.url);
  if (!contentUrl) return null;
  return {
    ...ctx,
    "@type": "ImageObject",
    contentUrl,
    ...(opts.name ? { name: opts.name } : {}),
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.caption ? { caption: opts.caption } : {}),
    ...(opts.credit ? { creditText: opts.credit } : {}),
  };
};

export type ItemListInput = {
  /** Absolute or root-relative URL of the listing page itself. */
  path?: string;
  name?: string;
  items: { name?: string; path: string; image?: string | null }[];
};

/** ItemList for a listing page; entries derive from the rendered content. */
export const itemList = ({ path, name, items }: ItemListInput): Node => ({
  ...ctx,
  "@type": "ItemList",
  ...(name ? { name } : {}),
  ...(path ? { url: absoluteUrl(path) } : {}),
  numberOfItems: items.length,
  itemListOrder: "https://schema.org/ItemListOrderAscending",
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    url: absoluteUrl(item.path),
    ...(item.name ? { name: item.name } : {}),
    ...(item.image ? { image: absoluteUrl(item.image) } : {}),
  })),
});

/* ------------------------------------------------------------------ *
 * Content-type generators.
 * ------------------------------------------------------------------ */

type ArtistLike = {
  name: string;
  slug: string;
  genre?: string | null;
  shortDescription?: string | null;
  heroImage?: string | null;
  artistLinks?: {
    spotify?: string;
    appleMusic?: string;
    youtube?: string;
    youtubeMusic?: string;
    amazonMusic?: string;
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    /** Storefront, NOT an identity profile — deliberately excluded from sameAs. */
    store?: string;
  };
};

/**
 * Artist-level sameAs, in the agreed order. Blanks are skipped silently, an
 * artist with none of the eight gets no sameAs at all, and "Store - Artist URL"
 * is never included (storefront, not identity).
 */
export const artistSameAs = (artist: ArtistLike): string[] | undefined => {
  const l = artist.artistLinks || {};
  return sameAsList([
    l.spotify,
    l.appleMusic,
    l.youtube,
    l.youtubeMusic,
    l.amazonMusic,
    l.instagram,
    l.facebook,
    l.tiktok,
  ]);
};

type ReleaseLike = {
  slug: string;
  title: string;
  coverArt?: string | null;
  releaseDate?: string | null;
  releaseType?: string | null;
  shortDescription?: string | null;
  fullDescription?: string | null;
  artistName?: string | null;
  artistSlug?: string | null;
  streamingLinks?: {
    spotify?: string;
    appleMusic?: string;
    youtube?: string;
    youtubeMusic?: string;
    amazonMusic?: string;
    bandcamp?: string;
    tidal?: string;
  };
};

type TrackLike = {
  trackTitle: string;
  trackNumber?: number;
  duration?: string | null;
  spotifyUrl?: string | null;
  isrc?: string | null;
};

export type ReleaseSchemaInput = {
  release: ReleaseLike;
  artist?: { name: string; slug: string; genre?: string | null } | null;
  tracks?: TrackLike[];
};

const releaseSameAs = (release: ReleaseLike): string[] | undefined => {
  const s = release.streamingLinks || {};
  return sameAsList([s.spotify, s.appleMusic, s.youtubeMusic, s.youtube, s.amazonMusic, s.bandcamp, s.tidal]);
};

const byArtistNode = (input: ReleaseSchemaInput): Node | undefined => {
  const { release, artist } = input;
  const name = artist?.name || release.artistName;
  const slug = artist?.slug || release.artistSlug;
  if (!name) return undefined;
  return {
    "@type": "MusicGroup",
    name,
    ...(slug ? { url: absoluteUrl(`/artists/${slug}`) } : {}),
  };
};

const trackNode = (t: TrackLike, i: number, input: ReleaseSchemaInput): Node => ({
  "@type": "MusicRecording",
  name: t.trackTitle,
  position: t.trackNumber || i + 1,
  ...(isoDuration(t.duration) ? { duration: isoDuration(t.duration) } : {}),
  ...(t.isrc ? { isrcCode: t.isrc } : {}),
  ...(byArtistNode(input) ? { byArtist: byArtistNode(input) } : {}),
  inLanguage: SITE_LANGUAGE,
});

const releaseCommon = (input: ReleaseSchemaInput): Node => {
  const { release, artist } = input;
  const genre = artist?.genre || undefined;
  return {
    ...ctx,
    name: release.title,
    url: absoluteUrl(`/releases/${release.slug}`),
    ...(url(release.coverArt) ? { image: url(release.coverArt) } : {}),
    ...(release.releaseDate ? { datePublished: release.releaseDate } : {}),
    ...(release.shortDescription || release.fullDescription
      ? { description: release.shortDescription || release.fullDescription }
      : {}),
    ...(byArtistNode(input) ? { byArtist: byArtistNode(input) } : {}),
    ...(genre ? { genre } : {}),
    ...(releaseSameAs(release) ? { sameAs: releaseSameAs(release) } : {}),
    inLanguage: SITE_LANGUAGE,
  };
};

/** Multi-track release. "track" belongs to MusicAlbum, never MusicRecording. */
export const musicAlbum = (input: ReleaseSchemaInput): Node => {
  const tracks = input.tracks || [];
  const total = tracks.reduce((sum, t) => sum + secondsOf(t.duration), 0);
  return {
    ...releaseCommon(input),
    "@type": "MusicAlbum",
    ...(input.release.releaseType === "EP" || input.release.releaseType === "Album"
      ? { albumProductionType: "https://schema.org/StudioAlbum" }
      : {}),
    numTracks: tracks.length,
    ...(secondsToIso(total) ? { duration: secondsToIso(total) } : {}),
    track: tracks.map((t, i) => trackNode(t, i, input)),
  };
};

/** Genuine single-track release: a bare MusicRecording, no "track" array. */
export const musicRecording = (input: ReleaseSchemaInput): Node => {
  const t = (input.tracks || [])[0];
  const duration = isoDuration(t?.duration);
  return {
    ...releaseCommon(input),
    "@type": "MusicRecording",
    ...(duration ? { duration } : {}),
    ...(t?.isrc ? { isrcCode: t.isrc } : {}),
  };
};

/**
 * Release schema chosen by ACTUAL TRACK COUNT, not the releaseType label, so a
 * mislabelled release cannot produce invalid markup.
 */
export const release = (input: ReleaseSchemaInput): Node =>
  (input.tracks || []).length > 1 ? musicAlbum(input) : musicRecording(input);

export type MusicGroupInput = {
  artist: ArtistLike;
  discography?: { title: string; slug: string; coverArt?: string | null; releaseDate?: string | null }[];
};

export const musicGroup = ({ artist, discography = [] }: MusicGroupInput): Node => {
  const sameAs = artistSameAs(artist);
  return {
    ...ctx,
    "@type": "MusicGroup",
    name: artist.name,
    url: absoluteUrl(`/artists/${artist.slug}`),
    ...(url(artist.heroImage) ? { image: url(artist.heroImage) } : {}),
    ...(artist.genre ? { genre: artist.genre } : {}),
    ...(artist.shortDescription ? { description: artist.shortDescription } : {}),
    ...(sameAs ? { sameAs } : {}),
    inLanguage: SITE_LANGUAGE,
    album: discography.map((r) => ({
      "@type": "MusicAlbum",
      name: r.title,
      url: absoluteUrl(`/releases/${r.slug}`),
      ...(url(r.coverArt) ? { image: url(r.coverArt) } : {}),
      ...(r.releaseDate ? { datePublished: r.releaseDate } : {}),
    })),
  };
};

export type BlogPostingInput = {
  article: {
    slug: string;
    title: string;
    coverImage?: string | null;
    publishedDate?: string | null;
    createdTime?: string | null;
    lastEditedTime?: string | null;
  };
  description?: string | null;
  relatedArtists?: { name: string; slug: string }[];
  relatedReleases?: { title: string; slug: string }[];
};

export const blogPosting = ({
  article: a,
  description,
  relatedArtists = [],
  relatedReleases = [],
}: BlogPostingInput): Node => ({
  ...ctx,
  "@type": "BlogPosting",
  headline: a.title,
  ...(description ? { description } : {}),
  ...(url(a.coverImage) ? { image: url(a.coverImage) } : {}),
  ...(a.publishedDate || a.createdTime ? { datePublished: a.publishedDate || a.createdTime } : {}),
  ...(a.lastEditedTime || a.publishedDate ? { dateModified: a.lastEditedTime || a.publishedDate } : {}),
  mainEntityOfPage: absoluteUrl(`/journal/${a.slug}`),
  inLanguage: SITE_LANGUAGE,
  author: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: SITE_LEGAL_NAME,
    logo: { "@type": "ImageObject", url: absoluteUrl(LOGO_URL) },
  },
  about: [
    ...relatedArtists.map((art) => ({
      "@type": "MusicGroup",
      name: art.name,
      url: absoluteUrl(`/artists/${art.slug}`),
    })),
    ...relatedReleases.map((rel) => ({
      "@type": "MusicAlbum",
      name: rel.title,
      url: absoluteUrl(`/releases/${rel.slug}`),
    })),
  ],
});

export type VideoObjectInput = {
  name: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  uploadDate?: string | null;
  embedUrl?: string | null;
  contentUrl?: string | null;
  duration?: string | null;
  /** Page the video lives on, once per-video routes exist. */
  path?: string | null;
  artistName?: string | null;
  artistSlug?: string | null;
};

export const videoObject = (v: VideoObjectInput): Node => ({
  ...ctx,
  "@type": "VideoObject",
  name: v.name,
  ...(v.description ? { description: v.description } : {}),
  ...(url(v.thumbnailUrl) ? { thumbnailUrl: url(v.thumbnailUrl) } : {}),
  ...(v.uploadDate ? { uploadDate: v.uploadDate } : {}),
  ...(v.embedUrl ? { embedUrl: absoluteUrl(v.embedUrl) } : {}),
  ...(v.contentUrl ? { contentUrl: absoluteUrl(v.contentUrl) } : {}),
  ...(isoDuration(v.duration) ? { duration: isoDuration(v.duration) } : {}),
  ...(v.path ? { url: absoluteUrl(v.path) } : {}),
  inLanguage: SITE_LANGUAGE,
  ...(v.artistName
    ? {
        author: {
          "@type": "MusicGroup",
          name: v.artistName,
          ...(v.artistSlug ? { url: absoluteUrl(`/artists/${v.artistSlug}`) } : {}),
        },
      }
    : {}),
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: SITE_LEGAL_NAME,
    logo: { "@type": "ImageObject", url: absoluteUrl(LOGO_URL) },
  },
});

export type ProductInput = {
  name: string;
  path?: string | null;
  image?: string | null;
  description?: string | null;
  sku?: string | null;
  format?: string | null;
  brandName?: string | null;
  offer?: {
    /** Storefront URL — this is where "Store - Artist URL" style links belong. */
    url?: string | null;
    price?: number | string | null;
    priceCurrency?: string | null;
    availability?: string | null;
    priceValidUntil?: string | null;
  } | null;
};

/**
 * Product generator. Written now; the Store page is wired to it in a later
 * piece of work.
 */
export const product = (p: ProductInput): Node => ({
  ...ctx,
  "@type": "Product",
  name: p.name,
  ...(p.path ? { url: absoluteUrl(p.path) } : {}),
  ...(url(p.image) ? { image: url(p.image) } : {}),
  ...(p.description ? { description: p.description } : {}),
  ...(p.sku ? { sku: p.sku } : {}),
  ...(p.format ? { material: p.format } : {}),
  brand: { "@type": "Brand", name: p.brandName || SITE_LEGAL_NAME },
  ...(p.offer
    ? {
        offers: {
          "@type": "Offer",
          ...(p.offer.url ? { url: absoluteUrl(p.offer.url) } : {}),
          ...(p.offer.price != null && p.offer.price !== "" ? { price: p.offer.price } : {}),
          priceCurrency: p.offer.priceCurrency || "GBP",
          availability: p.offer.availability || "https://schema.org/InStock",
          ...(p.offer.priceValidUntil ? { priceValidUntil: p.offer.priceValidUntil } : {}),
          seller: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
        },
      }
    : {}),
});

/* ------------------------------------------------------------------ *
 * The dispatcher. An unknown content type THROWS — the pre-render build
 * fails loudly rather than shipping a page with no structured data.
 * ------------------------------------------------------------------ */

const GENERATORS = {
  organization,
  website,
  breadcrumbList,
  imageObject,
  itemList,
  musicGroup,
  musicAlbum,
  musicRecording,
  release,
  blogPosting,
  videoObject,
  product,
} as const;

export type SchemaType = keyof typeof GENERATORS;
export const schemaTypes = Object.keys(GENERATORS) as SchemaType[];

export function schemaFor<T extends SchemaType>(
  type: T,
  input: Parameters<(typeof GENERATORS)[T]>[0],
): Node {
  const generator = GENERATORS[type] as ((i: unknown) => Node | null) | undefined;
  if (typeof generator !== "function") {
    throw new Error(
      `[schema] No JSON-LD generator for content type "${String(type)}". ` +
        `Add one to src/lib/schema.ts — every content type must have a generator.`,
    );
  }
  const node = generator(input);
  if (!node) {
    throw new Error(`[schema] Generator "${String(type)}" produced no JSON-LD.`);
  }
  return node;
}
