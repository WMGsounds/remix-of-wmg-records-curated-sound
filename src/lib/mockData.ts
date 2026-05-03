import type { Artist, HomepageData, Release, ReleasePageData, ArtistPageData, Track } from "./types";

const image = (name: string) => `/mock/${name}`;

// MOCK DATA — used only when Notion API JSON cannot be loaded in preview.
export const mockArtists: Artist[] = [
  {
    id: "mock-artist-aurora-vale",
    slug: "aurora-vale",
    name: "Aurora Vale",
    genre: "Alt Pop, Cinematic Soul",
    shortDescription: "A London vocalist building widescreen pop from intimate fragments and late-night synth textures.",
    fullBio: [
      "Aurora Vale writes songs that feel both close-up and panoramic, pairing unguarded vocal takes with production that moves like city light across glass.",
      "Her world sits between modern soul, alt pop and cinematic electronics — direct, emotional and carefully crafted.",
    ],
    heroImage: image("artist-1.jpg"),
    heroImage2: image("artist-2.jpg"),
    gallery: [image("artist-1.jpg"), image("artist-2.jpg")],
    featured: true,
    displayOrder: 1,
    accentColour: null,
  },
  {
    id: "mock-artist-milo-saint",
    slug: "milo-saint",
    name: "Milo Saint",
    genre: "Indie R&B, Electronic",
    shortDescription: "Minimalist rhythm sketches, warm low-end and refrains built for headphones after midnight.",
    fullBio: ["Milo Saint makes understated records with emotional weight, drawing from club rhythm, diaristic R&B and spacious electronic production."],
    heroImage: image("artist-2.jpg"),
    heroImage2: image("artist-3.jpg"),
    gallery: [image("artist-2.jpg"), image("artist-3.jpg")],
    featured: true,
    displayOrder: 2,
    accentColour: null,
  },
  {
    id: "mock-artist-the-north-room",
    slug: "the-north-room",
    name: "The North Room",
    genre: "Dream Pop, Guitar",
    shortDescription: "A guitar-led project shaped by analogue haze, spacious drums and restrained hooks.",
    fullBio: ["The North Room turns small observations into textured guitar music, leaving space for atmosphere, repetition and slowly unfolding melodies."],
    heroImage: image("artist-3.jpg"),
    heroImage2: "",
    gallery: [image("artist-3.jpg"), image("artist-1.jpg")],
    featured: true,
    displayOrder: 3,
    accentColour: null,
  },
];

export const mockReleases: Release[] = [
  {
    id: "mock-release-glass-hours",
    slug: "glass-hours",
    title: "Glass Hours",
    artistId: "mock-artist-aurora-vale",
    artistSlug: "aurora-vale",
    artistName: "Aurora Vale",
    releaseDate: "2026-02-14",
    releaseType: "Single",
    coverArt: image("release-1.jpg"),
    shortDescription: "A luminous single about distance, timing and the strange clarity of early morning.",
    fullDescription: "Glass Hours places Aurora Vale’s voice against slow-burning synths, brushed percussion and a chorus that opens gradually rather than arriving all at once.",
    featured: true,
    showOnHomepage: true,
    streamingLinks: {},
    catalogueId: "WMG-MOCK-001",
    displayOrder: 1,
  },
  {
    id: "mock-release-night-geometry",
    slug: "night-geometry",
    title: "Night Geometry",
    artistId: "mock-artist-milo-saint",
    artistSlug: "milo-saint",
    artistName: "Milo Saint",
    releaseDate: "2026-01-19",
    releaseType: "EP",
    coverArt: image("release-2.jpg"),
    shortDescription: "Five compact tracks tracing movement through a city after dark.",
    fullDescription: "Night Geometry blends soft vocal stacks, clipped drums and sub-heavy production into a concise late-night EP.",
    featured: false,
    showOnHomepage: true,
    streamingLinks: {},
    catalogueId: "WMG-MOCK-002",
    displayOrder: 2,
  },
  {
    id: "mock-release-static-bloom",
    slug: "static-bloom",
    title: "Static Bloom",
    artistId: "mock-artist-the-north-room",
    artistSlug: "the-north-room",
    artistName: "The North Room",
    releaseDate: "2025-11-07",
    releaseType: "Album",
    coverArt: image("release-3.jpg"),
    shortDescription: "A textured debut shaped by tape warmth, patient guitars and quiet momentum.",
    fullDescription: "Static Bloom is a slow-burn guitar record with analogue edges, close-mic vocals and arrangements that reward repeated listening.",
    featured: false,
    showOnHomepage: true,
    streamingLinks: {},
    catalogueId: "WMG-MOCK-003",
    displayOrder: 3,
  },
];

export const mockTracks: Track[] = [
  { id: "mock-track-glass-hours-1", trackTitle: "Glass Hours", releaseId: "mock-release-glass-hours", releaseSlug: "glass-hours", trackNumber: 1, duration: "3:42", lyrics: null },
  { id: "mock-track-night-geometry-1", trackTitle: "Afterimage", releaseId: "mock-release-night-geometry", releaseSlug: "night-geometry", trackNumber: 1, duration: "2:58", lyrics: null },
  { id: "mock-track-night-geometry-2", trackTitle: "Low Signal", releaseId: "mock-release-night-geometry", releaseSlug: "night-geometry", trackNumber: 2, duration: "3:21", lyrics: null },
  { id: "mock-track-static-bloom-1", trackTitle: "First Light Static", releaseId: "mock-release-static-bloom", releaseSlug: "static-bloom", trackNumber: 1, duration: "4:06", lyrics: null },
];

export const mockHomepage = (): HomepageData => ({
  featuredArtists: mockArtists.filter((a) => a.featured).slice(0, 6),
  latestReleases: mockReleases.filter((r) => r.showOnHomepage).slice(0, 6),
  featuredRelease: mockReleases.find((r) => r.featured) ?? mockReleases[0] ?? null,
});

export const mockArtistPage = (slug: string): ArtistPageData | null => {
  const artist = mockArtists.find((a) => a.slug === slug) ?? mockArtists[0];
  if (!artist) return null;
  return {
    artist,
    discography: mockReleases
      .filter((r) => r.artistSlug === artist.slug)
      .sort((a, b) => +new Date(b.releaseDate) - +new Date(a.releaseDate)),
  };
};

export const mockReleasePage = (slug: string): ReleasePageData | null => {
  const release = mockReleases.find((r) => r.slug === slug) ?? mockReleases[0];
  if (!release) return null;
  return {
    release,
    artist: mockArtists.find((a) => a.id === release.artistId) ?? null,
    tracks: mockTracks.filter((t) => t.releaseSlug === release.slug).sort((a, b) => a.trackNumber - b.trackNumber),
    related: mockReleases.filter((r) => r.artistSlug === release.artistSlug && r.slug !== slug).slice(0, 3),
  };
};

export function getMockDataForPath(path: string): unknown {
  if (path === "/api/notion/artists") return mockArtists;
  if (path === "/api/notion/releases") return mockReleases;
  if (path === "/api/notion/tracks") return mockTracks;
  if (path === "/api/notion/homepage") return mockHomepage();
  if (path === "/api/notion/journal") return [];
  const artistSlug = path.match(/^\/api\/notion\/artist\/([^/]+)$/)?.[1];
  if (artistSlug) return mockArtistPage(decodeURIComponent(artistSlug));
  const releaseSlug = path.match(/^\/api\/notion\/release\/([^/]+)$/)?.[1];
  if (releaseSlug) return mockReleasePage(decodeURIComponent(releaseSlug));
  if (/^\/api\/notion\/journal\/[^/]+$/.test(path)) return null;
  return null;
}