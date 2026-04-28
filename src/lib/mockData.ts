// Mock data shaped EXACTLY like normalized Notion responses will be.
// Replaces the old hardcoded src/data/catalogue.ts during local dev.
// Once the Vercel /api/notion/* routes are live, this file is unused.

import artist1 from "@/assets/artist-1.jpg";
import artist2 from "@/assets/artist-2.jpg";
import artist3 from "@/assets/artist-3.jpg";
import artist4 from "@/assets/artist-4.jpg";
import release1 from "@/assets/release-1.jpg";
import release2 from "@/assets/release-2.jpg";
import release3 from "@/assets/release-3.jpg";
import release4 from "@/assets/release-4.jpg";

import type { Artist, Release, Track } from "./types";

export const mockArtists: Artist[] = [
  {
    id: "a1",
    slug: "marcus-vale",
    name: "Marcus Vale",
    genre: "Soul / Crooner",
    shortDescription: "A voice carved from late-night smoke and Sunday morning hymns.",
    fullBio: [
      "Marcus Vale writes from the seam where soul, gospel and the great American songbook meet. His records are intimate, deliberate, and built around a voice that needs no embellishment.",
      "Raised in a family of choir directors and self-taught pianists, his work draws on memory, ritual and the quiet authority of restraint.",
    ],
    heroImage: artist1,
    gallery: [artist1, artist1, artist1],
    featured: true,
    displayOrder: 1,
    accentColour: "#C9A24B",
  },
  {
    id: "a2",
    slug: "june-holloway",
    name: "June Holloway",
    genre: "Country / Americana",
    shortDescription: "Plain-spoken songs from the high plains and the long road home.",
    fullBio: [
      "June Holloway is a songwriter's songwriter — a thoughtful storyteller in the tradition of Lucinda Williams and Townes Van Zandt.",
      "Her records are unhurried, warm and unmistakably American, written in a language that doesn't ask for translation.",
    ],
    heroImage: artist2,
    gallery: [artist2, artist2, artist2],
    featured: true,
    displayOrder: 2,
    accentColour: null,
  },
  {
    id: "a3",
    slug: "kofi-river",
    name: "Kofi River",
    genre: "Reggae / Island",
    shortDescription: "Sun-soaked grooves rooted in Kingston and tomorrow.",
    fullBio: [
      "Kofi River bridges classic roots reggae with contemporary production, building songs that feel ancient and entirely present.",
      "His writing returns again and again to themes of home, lineage and the weight a melody can carry across an ocean.",
    ],
    heroImage: artist3,
    gallery: [artist3, artist3, artist3],
    featured: true,
    displayOrder: 3,
    accentColour: null,
  },
  {
    id: "a4",
    slug: "iris-naoko",
    name: "Iris Naoko",
    genre: "Classical / Ethereal",
    shortDescription: "Chamber music for the spaces between thoughts.",
    fullBio: [
      "Composer and cellist Iris Naoko writes for small ensembles and quiet rooms. Her work sits between contemporary classical and ambient — minimal, weightless, and deeply felt.",
      "She has scored short film, theatre and gallery commissions across Tokyo, London and Berlin.",
    ],
    heroImage: artist4,
    gallery: [artist4, artist4, artist4],
    featured: true,
    displayOrder: 4,
    accentColour: null,
  },
];

export const mockReleases: Release[] = [
  {
    id: "r1",
    slug: "after-the-room",
    title: "After the Room",
    artistId: "a1",
    artistSlug: "marcus-vale",
    artistName: "Marcus Vale",
    releaseDate: "2025-09-12",
    releaseType: "Album",
    coverArt: release1,
    shortDescription: "Nine songs on memory and aftermath.",
    fullDescription:
      "A nine-song meditation on memory and aftermath, recorded live to tape in a single London weekend.",
    featured: true,
    showOnHomepage: true,
    streamingLinks: {
      spotify: "https://open.spotify.com/",
      appleMusic: "https://music.apple.com/",
      bandcamp: "https://bandcamp.com/",
      tidal: "https://tidal.com/",
    },
    catalogueId: "WMG001",
    displayOrder: 1,
  },
  {
    id: "r2",
    slug: "low-tide",
    title: "Low Tide",
    artistId: "a4",
    artistSlug: "iris-naoko",
    artistName: "Iris Naoko",
    releaseDate: "2025-06-04",
    releaseType: "Single",
    coverArt: release2,
    shortDescription: "Cello, breath and quiet rain.",
    fullDescription:
      "A single drawn from Iris Naoko's forthcoming chamber suite. Cello, breath and quiet rain.",
    featured: false,
    showOnHomepage: true,
    streamingLinks: { spotify: "https://open.spotify.com/" },
    catalogueId: "WMG002",
    displayOrder: 2,
  },
  {
    id: "r3",
    slug: "if-the-road-asks",
    title: "If the Road Asks",
    artistId: "a2",
    artistSlug: "june-holloway",
    artistName: "June Holloway",
    releaseDate: "2024-11-08",
    releaseType: "EP",
    coverArt: release3,
    shortDescription: "Five songs about leaving.",
    fullDescription: "Five songs about leaving and what leaving leaves behind.",
    featured: false,
    showOnHomepage: true,
    streamingLinks: { spotify: "https://open.spotify.com/", appleMusic: "https://music.apple.com/" },
    catalogueId: "WMG003",
    displayOrder: 3,
  },
  {
    id: "r4",
    slug: "moonwater",
    title: "Moonwater",
    artistId: "a3",
    artistSlug: "kofi-river",
    artistName: "Kofi River",
    releaseDate: "2024-04-19",
    releaseType: "Album",
    coverArt: release4,
    shortDescription: "A late-night record.",
    fullDescription: "A late-night record. Bass, brass and the slow gravity of the sea.",
    featured: false,
    showOnHomepage: true,
    streamingLinks: { spotify: "https://open.spotify.com/" },
    catalogueId: "WMG004",
    displayOrder: 4,
  },
];

const buildTracks = (
  releaseId: string,
  releaseSlug: string,
  titles: string[],
  durations: string[],
): Track[] =>
  titles.map((trackTitle, i) => ({
    id: `${releaseId}-t${i + 1}`,
    trackTitle,
    releaseId,
    releaseSlug,
    trackNumber: i + 1,
    duration: durations[i] ?? "3:30",
    lyrics: i === 1 ? "Verse one\nWords of memory and dust\nChorus follows like a long exhale\n…" : null,
  }));

export const mockTracks: Track[] = [
  ...buildTracks(
    "r1",
    "after-the-room",
    ["Overture", "After the Room", "Sunday, Without You", "Brass and Bone", "The Long Way", "Quiet, Quiet", "Amber Light", "Letter, Unsent", "Coda"],
    ["1:42", "4:18", "3:55", "4:02", "5:11", "3:28", "4:44", "3:07", "2:19"],
  ),
  ...buildTracks("r2", "low-tide", ["Low Tide"], ["6:12"]),
  ...buildTracks(
    "r3",
    "if-the-road-asks",
    ["If the Road Asks", "Telegraph Hill", "Kerosene Sunday", "The Last Postcard", "Stay Awhile"],
    ["3:48", "4:11", "3:33", "4:22", "5:05"],
  ),
  ...buildTracks(
    "r4",
    "moonwater",
    ["Moonwater", "Harbour", "Salt Hymn", "Kingston, 4am", "Long Walk Home", "What the Tide Knows", "Lantern", "Coda for Mama"],
    ["4:01", "3:44", "4:55", "5:10", "3:38", "4:22", "3:12", "2:48"],
  ),
];
