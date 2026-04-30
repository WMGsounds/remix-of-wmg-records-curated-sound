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
  displayOrder: number;
  accentColour?: string | null;
  // future:
  artistLinks?: StreamingLinks;
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
  streamingLinks: StreamingLinks;
  catalogueId?: string | null;
  displayOrder: number;
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
