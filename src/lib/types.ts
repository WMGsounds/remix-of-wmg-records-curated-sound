// Shared CMS types — shape mirrors what the Vercel /api/notion/* routes will return.
// The frontend never imports from Notion directly; it consumes only this normalized shape.

export type ReleaseType = "Single" | "EP" | "Album";

export type StreamingLinks = {
  spotify?: string;
  appleMusic?: string;
  bandcamp?: string;
  tidal?: string;
  youtube?: string;
  youtubeMusic?: string;
  amazonMusic?: string;
};

export type ArtistLinks = {
  store?: string;
  youtube?: string;
  spotify?: string;
  appleMusic?: string;
  amazonMusic?: string;
};

export type Artist = {
  id: string;
  slug: string;
  name: string;
  genre: string;
  shortDescription: string;
  fullBio: string[]; // paragraphs
  heroImage: string;
  heroImage2?: string;
  gallery: string[];
  featured: boolean;
  showOnWebsite?: boolean;
  displayOrder: number;
  accentColour?: string | null;
  // Links shown in the Artist page "Listen & Watch" section.
  artistLinks?: ArtistLinks;
  // Reserved for future expansion; kept for backwards-compat.
  streamingLinks?: StreamingLinks;
};

export type Release = {
  id: string;
  slug: string;
  title: string;
  artistId: string;
  artistSlug: string;
  artistName: string;
  releaseDate: string; // ISO
  releaseType: ReleaseType;
  coverArt: string;
  shortDescription: string;
  fullDescription: string;
  featured: boolean;
  showOnHomepage: boolean;
  showOnWebsite?: boolean;
  streamingLinks: StreamingLinks;
  catalogueId?: string | null;
  displayOrder: number;
  pLine?: string | null;
  cLine?: string | null;
  upc?: string | null;
  parentAlbumId?: string | null;
  parentAlbum?: { id: string; title: string; slug: string | null } | null;
};

export type Track = {
  id: string;
  trackTitle: string;
  releaseId: string;
  releaseSlug: string;
  trackNumber: number;
  duration: string; // mm:ss
  lyrics?: string | null;
  spotifyUrl?: string | null;
  // future:
  isrc?: string | null;
  writers?: string[];
  producers?: string[];
  explicit?: boolean;
  featuredTrack?: boolean;
};

export type HomepageData = {
  featuredArtists: Artist[]; // Featured = true, capped 4–6
  latestReleases: Release[]; // showOnHomepage = true, sorted by date desc, capped 6
  featuredRelease: Release | null; // single flagship
};

export type ArtistPageData = {
  artist: Artist;
  discography: Release[]; // sorted by releaseDate desc
};

export type ReleasePageData = {
  release: Release;
  artist: Artist | null;
  tracks: Track[]; // sorted by trackNumber asc
  related: Release[]; // same artist, excluding current
};

// ---------- Journal ----------

export type JournalRichText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
  href?: string | null;
};

export type JournalBlock =
  | { type: "paragraph"; rich: JournalRichText[] }
  | { type: "heading_2"; rich: JournalRichText[] }
  | { type: "heading_3"; rich: JournalRichText[] }
  | { type: "quote"; rich: JournalRichText[] }
  | { type: "divider" }
  | { type: "bulleted_list"; items: JournalRichText[][] }
  | { type: "numbered_list"; items: JournalRichText[][] }
  | { type: "image"; url: string; caption: string; alt: string };

export type JournalArticleSummary = {
  id: string;
  slug: string;
  title: string;
  category: string;
  album: string;
  publishedDate: string;
  coverImage: string;
  excerpt: string;
  summary: string;
  readingTime: number;
  published: boolean;
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  noindex: boolean;
  socialCaption: string;
  imageAlt: string;
  createdTime: string;
  lastEditedTime: string;
  artistIds: string[];
  releaseIds: string[];
  trackIds: string[];
  artists: { id: string; slug: string; name: string }[];
  releases: { id: string; slug: string; title: string; coverArt: string }[];
};

export type JournalArticleData = {
  article: JournalArticleSummary;
  blocks: JournalBlock[];
  relatedArtists: Artist[];
  relatedReleases: Release[];
};

// ---------- Store ----------

export type StoreFormat = "Vinyl" | "CD" | "iTunes" | "Digital" | "Merch" | "Other";
export type StoreAvailability = "Available Now" | "Coming Soon" | "Sold Out" | "Hidden";

export type StoreItem = {
  id: string;
  slug: string | null;
  title: string;
  artist: { id: string; slug: string; name: string } | null;
  release: { id: string; slug: string; title: string } | null;
  relatedTracks: { id: string; title: string }[];
  formats: StoreFormat[];
  prices: Partial<Record<StoreFormat, string>>;
  displayPriceSummary: boolean;
  priceSummary: string | null;
  purchaseLink: string | null;
  productImage: string;
  description: string;
  availability: StoreAvailability;
  featured: boolean;
  buttonText: string | null;
  comments: string | null;
  productType: string | null;
  createdTime: string;
};

