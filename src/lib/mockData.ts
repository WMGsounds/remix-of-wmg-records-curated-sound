import type { Artist, HomepageData, Release, ReleasePageData, ArtistPageData, Track, StoreItem, GalleryImage } from "./types";

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
    artistLinks: {
      store: "https://example.com/shop/aurora-vale",
      youtube: "https://youtube.com/@auroravale",
      youtubeMusic: "https://music.youtube.com/channel/auroravale",
      spotify: "https://open.spotify.com/artist/auroravale",
      appleMusic: "https://music.apple.com/artist/auroravale",
      amazonMusic: "https://music.amazon.com/artists/auroravale",
    },
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
  { id: "mock-track-glass-hours-1", trackTitle: "Glass Hours", releaseId: "mock-release-glass-hours", releaseSlug: "glass-hours", releaseTitle: "Glass Hours", releaseDate: "2024-09-13", artistName: "Aurora Vale", artistSlug: "aurora-vale", trackNumber: 1, duration: "3:42", lyrics: null, youtubeMusicVideo: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", youtubeOfficialAudio: "https://youtu.be/9bZkp7q19f0" },
  { id: "mock-track-night-geometry-1", trackTitle: "Afterimage", releaseId: "mock-release-night-geometry", releaseSlug: "night-geometry", releaseTitle: "Night Geometry", releaseDate: "2024-04-05", artistName: "Kestrel Lane", artistSlug: "kestrel-lane", trackNumber: 1, duration: "2:58", lyrics: null, youtubeLyricVideo: "https://www.youtube.com/watch?v=3JZ_D3ELwOQ" },
  { id: "mock-track-night-geometry-2", trackTitle: "Low Signal", releaseId: "mock-release-night-geometry", releaseSlug: "night-geometry", releaseTitle: "Night Geometry", releaseDate: "2024-04-05", artistName: "Kestrel Lane", artistSlug: "kestrel-lane", trackNumber: 2, duration: "3:21", lyrics: null, youtubeOfficialAudio: "https://www.youtube.com/watch?v=M7lc1UVf-VE" },
  { id: "mock-track-static-bloom-1", trackTitle: "First Light Static", releaseId: "mock-release-static-bloom", releaseSlug: "static-bloom", releaseTitle: "Static Bloom", releaseDate: "2023-11-17", artistName: "Aurora Vale", artistSlug: "aurora-vale", trackNumber: 1, duration: "4:06", lyrics: null, youtubeMusicVideo: "https://www.youtube.com/shorts/aqz-KE-bpKQ" },
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

export const mockStoreItems: StoreItem[] = [
  {
    id: "mock-store-glass-hours-bundle",
    slug: "glass-hours-bundle",
    title: "Glass Hours — Collector's Bundle",
    artist: { id: "mock-artist-aurora-vale", slug: "aurora-vale", name: "Aurora Vale" },
    release: { id: "mock-release-glass-hours", slug: "glass-hours", title: "Glass Hours" },
    relatedTracks: [{ id: "mock-track-glass-hours-1", title: "Glass Hours" }],
    formats: ["Vinyl", "CD", "iTunes"],
    prices: { Vinyl: "£24.99", CD: "£12.99", iTunes: "£7.99" },
    displayPriceSummary: true,
    priceSummary: "From £7.99",
    purchaseLink: "https://example.com/glass-hours",
    productImage: image("release-1.jpg"),
    description: "Limited collector's edition of Glass Hours on heavyweight vinyl, alongside CD and digital formats.",
    availability: "Available Now",
    preOrder: false,
    featured: true,
    buttonText: "View Purchase Options",
    comments: null,
    productType: null,
    createdTime: "2026-01-15T10:00:00.000Z",
  },
  {
    id: "mock-store-night-geometry-vinyl",
    slug: "night-geometry-vinyl",
    title: "Night Geometry — Limited Vinyl",
    artist: { id: "mock-artist-milo-saint", slug: "milo-saint", name: "Milo Saint" },
    release: { id: "mock-release-night-geometry", slug: "night-geometry", title: "Night Geometry" },
    relatedTracks: [
      { id: "mock-track-night-geometry-1", title: "Afterimage" },
      { id: "mock-track-night-geometry-2", title: "Low Signal" },
    ],
    formats: ["Vinyl", "Digital"],
    prices: { Vinyl: "£22.00" },
    displayPriceSummary: false,
    priceSummary: null,
    purchaseLink: "https://example.com/night-geometry",
    productImage: image("release-2.jpg"),
    description: "Five-track EP pressed on translucent 12\" vinyl with download code.",
    availability: "Available Now",
    preOrder: false,
    featured: false,
    buttonText: null,
    comments: null,
    productType: null,
    createdTime: "2026-02-20T10:00:00.000Z",
  },
  {
    id: "mock-store-static-bloom-cd",
    slug: "static-bloom-cd",
    title: "Static Bloom — Signed CD",
    artist: { id: "mock-artist-the-north-room", slug: "the-north-room", name: "The North Room" },
    release: { id: "mock-release-static-bloom", slug: "static-bloom", title: "Static Bloom" },
    relatedTracks: [],
    formats: ["CD"],
    prices: { CD: "£14.00" },
    displayPriceSummary: false,
    priceSummary: null,
    purchaseLink: null,
    productImage: image("release-3.jpg"),
    description: "Hand-signed CD edition of the debut album, limited to 200 copies.",
    availability: "Coming Soon",
    preOrder: true,
    featured: false,
    buttonText: null,
    comments: null,
    productType: null,
    createdTime: "2026-03-25T10:00:00.000Z",
  },
];


// DEV-ONLY mock gallery — only ever returned via getMockDataForPath, which is
// gated behind import.meta.env.DEV in src/lib/api.ts. Never served in production.
export const mockGalleryImages: GalleryImage[] = [
  ["Soundcheck, Camden", "Aurora Vale", "aurora-vale", "Live Performance", 1200, 1600],
  ["Studio B, take nine", "Bobby Chills", "bobby-chills", "Behind the Scenes", 1600, 1067],
  ["Portrait in low light", "Aurora Vale", "aurora-vale", "Portrait", 1000, 1500],
  ["Tape machine detail", "", "", "Editorial", 1600, 900],
  ["Sleeve shoot", "Tony Medley", "tony-medley", "Release Artwork", 1400, 1400],
  ["Backstage, second night", "Jack Rivers", "jack-rivers", "Behind the Scenes", 1500, 1000],
  ["Stage lights", "Jack Rivers", "jack-rivers", "Live Performance", 1080, 1620],
  ["WMG signage", "", "", "WMG / Brand", 1600, 1200],
  ["Rehearsal room", "Bobby Chills", "bobby-chills", "Portrait", 1200, 1500],
].map(([title, artistName, artistSlug, imageType, width, height], i) => ({
  id: `mock-gallery-${i + 1}`,
  galleryId: `GAL-${i + 1}`,
  title: title as string,
  imageUrl: `https://picsum.photos/seed/wmg-gallery-${i + 1}/${width}/${height}`,
  width: width as number,
  height: height as number,
  aspectRatio: (width as number) / (height as number),
  artistName: artistName as string,
  artistSlug: artistSlug as string,
  imageType: imageType as string,
  caption: `${title} — preview placeholder image.`,
  altText: `${title} (preview placeholder)`,
  credit: "WMG Archive",
  imageDate: `2025-0${(i % 9) + 1}-14`,
  publishDate: "2025-01-01",
  featured: i < 2,
  sortOrder: i + 1,
  focalPoint: "Centre",
  relatedRelease: "",
  relatedReleaseUrl: "",
  fileHash: `mock-hash-${i + 1}`,
}));

// DEV-ONLY mock videos (see note above) — never served in production.
export const mockVideos = [
  ["Golden Hour", "Aurora Vale", "aurora-vale", "Official Music Video", "dQw4w9WgXcQ"],
  ["Slow Tide", "Aurora Vale", "aurora-vale", "Official Lyric Video", "9bZkp7q19f0"],
  ["Ridgeline", "Jack Rivers", "jack-rivers", "Official Audio", "3JZ_D3ELwOQ"],
  ["The Complete Sessions", "", "", "Full Album", "kJQP7kiw5Fk"],
].map(([title, artistName, artistSlug, videoType, id], i) => ({
  id: `mock-video-${i + 1}`,
  title: title as string,
  youtubeUrl: `https://www.youtube.com/watch?v=${id}`,
  youtubeId: id as string,
  videoType: videoType as string,
  artists: artistName ? [{ id: `mock-artist-${i}`, name: artistName as string, slug: artistSlug as string }] : [],
  relatedTrackIds: [],
  relatedReleaseIds: [],
  releaseDate: `2025-0${(i % 9) + 1}-12`,
  description: `${title} — preview placeholder video.`,
  featured: i === 0,
  sortOrder: null,
}));

export function getMockDataForPath(path: string): unknown {
  if (path === "/api/notion/artists") return mockArtists;
  if (path === "/api/notion/releases") return mockReleases;
  if (path === "/api/notion/tracks") return mockTracks;
  if (path === "/api/notion/store") return mockStoreItems;
  if (path === "/api/notion/homepage") return mockHomepage();
  if (path === "/api/notion/journal") return [];
  if (path === "/api/notion/gallery") return mockGalleryImages;
  if (path === "/api/notion/videos") return mockVideos;
  const artistSlug = path.match(/^\/api\/notion\/artist\/([^/]+)$/)?.[1];
  if (artistSlug) return mockArtistPage(decodeURIComponent(artistSlug));
  const releaseSlug = path.match(/^\/api\/notion\/release\/([^/]+)$/)?.[1];
  if (releaseSlug) return mockReleasePage(decodeURIComponent(releaseSlug));
  if (/^\/api\/notion\/journal\/[^/]+$/.test(path)) return null;
  return null;
}