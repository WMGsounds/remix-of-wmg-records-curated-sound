const image = (name: string) => `/mock/${name}`;

// MOCK DATA — returned with HTTP 200 when Notion env vars are missing or Notion calls fail.
export const fallbackArtists = [
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
    fullBio: [
      "Milo Saint makes understated records with emotional weight, drawing from club rhythm, diaristic R&B and spacious electronic production.",
    ],
    heroImage: image("artist-2.jpg"),
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
    fullBio: [
      "The North Room turns small observations into textured guitar music, leaving space for atmosphere, repetition and slowly unfolding melodies.",
    ],
    heroImage: image("artist-3.jpg"),
    gallery: [image("artist-3.jpg"), image("artist-1.jpg")],
    featured: true,
    displayOrder: 3,
    accentColour: null,
  },
];

export const fallbackReleases = [
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

export const fallbackTracks = [
  { id: "mock-track-glass-hours-1", trackTitle: "Glass Hours", releaseId: "mock-release-glass-hours", releaseSlug: "glass-hours", trackNumber: 1, duration: "3:42", lyrics: null },
  { id: "mock-track-night-geometry-1", trackTitle: "Afterimage", releaseId: "mock-release-night-geometry", releaseSlug: "night-geometry", trackNumber: 1, duration: "2:58", lyrics: null },
  { id: "mock-track-night-geometry-2", trackTitle: "Low Signal", releaseId: "mock-release-night-geometry", releaseSlug: "night-geometry", trackNumber: 2, duration: "3:21", lyrics: null },
  { id: "mock-track-static-bloom-1", trackTitle: "First Light Static", releaseId: "mock-release-static-bloom", releaseSlug: "static-bloom", trackNumber: 1, duration: "4:06", lyrics: null },
];

export const FALLBACK_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
  "X-Data-Source": "mock-fallback",
};

export const fallbackHomepage = () => {
  const featuredArtists = fallbackArtists.filter((a) => a.featured).slice(0, 6);
  const latestReleases = fallbackReleases.filter((r) => r.showOnHomepage).slice(0, 6);
  const featuredRelease = fallbackReleases.find((r) => r.featured) ?? latestReleases[0] ?? null;
  return { featuredArtists, latestReleases, featuredRelease };
};

export const fallbackArtistPage = (slug: string) => {
  const artist = fallbackArtists.find((a) => a.slug === slug) ?? fallbackArtists[0];
  if (!artist) return null;
  const discography = fallbackReleases.filter((r) => r.artistSlug === slug);
  return { artist, discography };
};

export const fallbackReleasePage = (slug: string) => {
  const release = fallbackReleases.find((r) => r.slug === slug) ?? fallbackReleases[0];
  if (!release) return null;
  const artist = fallbackArtists.find((a) => a.id === release.artistId) ?? null;
  const tracks = fallbackTracks.filter((t) => t.releaseSlug === slug).sort((a, b) => a.trackNumber - b.trackNumber);
  const related = fallbackReleases.filter((r) => r.artistSlug === release.artistSlug && r.slug !== slug).slice(0, 3);
  return { release, artist, tracks, related };
};