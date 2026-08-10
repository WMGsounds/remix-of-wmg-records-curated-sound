// api/notion/_client.ts
import { Client } from "@notionhq/client";
var notion = new Client({ auth: process.env.NOTION_TOKEN });
var REQUIRED_ENV = [
  "NOTION_TOKEN",
  "NOTION_ARTISTS_DB_ID",
  "NOTION_RELEASES_DB_ID",
  "NOTION_TRACKS_DB_ID",
  "NOTION_RELEASE_TRACKS_DB_ID"
];
var getEnvStatus = () => Object.fromEntries(REQUIRED_ENV.map((name) => [name, Boolean(process.env[name])]));
var summarizeError = (error) => {
  const e = error;
  return {
    name: e?.name,
    message: e?.message ?? String(error),
    code: e?.code,
    status: e?.status,
    stack: e?.stack
  };
};
function validateNotionEnv(route) {
  const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error("[notion-api] Missing required environment variables", {
      route,
      missing,
      envStatus: getEnvStatus()
    });
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
function logApiError(route, error, context = {}) {
  console.error("[notion-api] Route failed", {
    route,
    ...context,
    envStatus: getEnvStatus(),
    error: summarizeError(error)
  });
}
function logApiSuccess(route, context = {}) {
  console.log("[notion-api] Returning real Notion data", {
    route,
    ...context,
    envStatus: getEnvStatus()
  });
}
function logApiFallback(route, error, context = {}) {
  const summary = summarizeError(error);
  console.warn("[notion-api] Returning fallback mock data", {
    route,
    reason: summary.message,
    ...context,
    envStatus: getEnvStatus(),
    error: summary
  });
}
var DBS = {
  artists: process.env.NOTION_ARTISTS_DB_ID,
  releases: process.env.NOTION_RELEASES_DB_ID,
  tracks: process.env.NOTION_TRACKS_DB_ID,
  releaseTracks: process.env.NOTION_RELEASE_TRACKS_DB_ID,
  journal: process.env.NOTION_JOURNAL_DB_ID,
  storeItems: process.env.NOTION_STORE_DB_ID,
  gallery: process.env.NOTION_GALLERY_DATABASE_ID,
  videos: process.env.NOTION_VIDEOS_DATABASE_ID
};
function requireEnv(route, names) {
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length > 0) {
    console.error("[notion-api] Missing required env", { route, missing });
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
var CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, s-maxage=3000, stale-while-revalidate=600",
  "Content-Type": "application/json",
  "X-Data-Source": "notion"
};
var JOURNAL_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=60",
  "Content-Type": "application/json",
  "X-Data-Source": "notion"
};
var RELEASE_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=60",
  "Content-Type": "application/json",
  "X-Data-Source": "notion"
};
var GALLERY_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=60",
  "Content-Type": "application/json",
  "X-Data-Source": "notion"
};
var VIDEO_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=60",
  "Content-Type": "application/json",
  "X-Data-Source": "notion"
};

// api/notion/_fallback.ts
var image = (name) => `/mock/${name}`;
var fallbackArtists = [
  {
    id: "mock-artist-aurora-vale",
    slug: "aurora-vale",
    name: "Aurora Vale",
    genre: "Alt Pop, Cinematic Soul",
    shortDescription: "A London vocalist building widescreen pop from intimate fragments and late-night synth textures.",
    fullBio: [
      "Aurora Vale writes songs that feel both close-up and panoramic, pairing unguarded vocal takes with production that moves like city light across glass.",
      "Her world sits between modern soul, alt pop and cinematic electronics \u2014 direct, emotional and carefully crafted."
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
      amazonMusic: "https://music.amazon.com/artists/auroravale"
    }
  },
  {
    id: "mock-artist-milo-saint",
    slug: "milo-saint",
    name: "Milo Saint",
    genre: "Indie R&B, Electronic",
    shortDescription: "Minimalist rhythm sketches, warm low-end and refrains built for headphones after midnight.",
    fullBio: [
      "Milo Saint makes understated records with emotional weight, drawing from club rhythm, diaristic R&B and spacious electronic production."
    ],
    heroImage: image("artist-2.jpg"),
    heroImage2: image("artist-3.jpg"),
    gallery: [image("artist-2.jpg"), image("artist-3.jpg")],
    featured: true,
    displayOrder: 2,
    accentColour: null
  },
  {
    id: "mock-artist-the-north-room",
    slug: "the-north-room",
    name: "The North Room",
    genre: "Dream Pop, Guitar",
    shortDescription: "A guitar-led project shaped by analogue haze, spacious drums and restrained hooks.",
    fullBio: [
      "The North Room turns small observations into textured guitar music, leaving space for atmosphere, repetition and slowly unfolding melodies."
    ],
    heroImage: image("artist-3.jpg"),
    heroImage2: "",
    gallery: [image("artist-3.jpg"), image("artist-1.jpg")],
    featured: true,
    displayOrder: 3,
    accentColour: null
  }
];
var fallbackReleases = [
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
    fullDescription: "Glass Hours places Aurora Vale\u2019s voice against slow-burning synths, brushed percussion and a chorus that opens gradually rather than arriving all at once.",
    featured: true,
    showOnHomepage: true,
    streamingLinks: {},
    catalogueId: "WMG-MOCK-001",
    displayOrder: 1
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
    displayOrder: 2
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
    displayOrder: 3
  }
];
var fallbackTracks = [
  { id: "mock-track-glass-hours-1", trackTitle: "Glass Hours", releaseId: "mock-release-glass-hours", releaseSlug: "glass-hours", trackNumber: 1, duration: "3:42", lyrics: null },
  { id: "mock-track-night-geometry-1", trackTitle: "Afterimage", releaseId: "mock-release-night-geometry", releaseSlug: "night-geometry", trackNumber: 1, duration: "2:58", lyrics: null },
  { id: "mock-track-night-geometry-2", trackTitle: "Low Signal", releaseId: "mock-release-night-geometry", releaseSlug: "night-geometry", trackNumber: 2, duration: "3:21", lyrics: null },
  { id: "mock-track-static-bloom-1", trackTitle: "First Light Static", releaseId: "mock-release-static-bloom", releaseSlug: "static-bloom", trackNumber: 1, duration: "4:06", lyrics: null }
];
var fallbackStoreItems = [
  {
    id: "mock-store-glass-hours-bundle",
    slug: "glass-hours-bundle",
    title: "Glass Hours \u2014 Collector's Bundle",
    artist: { id: "mock-artist-aurora-vale", slug: "aurora-vale", name: "Aurora Vale" },
    release: { id: "mock-release-glass-hours", slug: "glass-hours", title: "Glass Hours" },
    relatedTracks: [
      { id: "mock-track-glass-hours-1", title: "Glass Hours" }
    ],
    formats: ["Vinyl", "CD", "iTunes"],
    prices: {
      Vinyl: "\xA324.99",
      CD: "\xA312.99",
      iTunes: "\xA37.99"
    },
    displayPriceSummary: true,
    priceSummary: "From \xA37.99",
    purchaseLink: "https://example.com/glass-hours",
    productImage: image("release-1.jpg"),
    description: "Limited collector's edition of Glass Hours on heavyweight vinyl, alongside CD and digital formats.",
    availability: "Available Now",
    preOrder: false,
    featured: true,
    buttonText: "View Purchase Options",
    createdTime: "2026-01-15T10:00:00.000Z"
  },
  {
    id: "mock-store-night-geometry-vinyl",
    slug: "night-geometry-vinyl",
    title: "Night Geometry \u2014 Limited Vinyl",
    artist: { id: "mock-artist-milo-saint", slug: "milo-saint", name: "Milo Saint" },
    release: { id: "mock-release-night-geometry", slug: "night-geometry", title: "Night Geometry" },
    relatedTracks: [
      { id: "mock-track-night-geometry-1", title: "Afterimage" },
      { id: "mock-track-night-geometry-2", title: "Low Signal" }
    ],
    formats: ["Vinyl", "Digital"],
    prices: {
      Vinyl: "\xA322.00"
    },
    displayPriceSummary: false,
    priceSummary: null,
    purchaseLink: "https://example.com/night-geometry",
    productImage: image("release-2.jpg"),
    description: 'Five-track EP pressed on translucent 12" vinyl with download code.',
    availability: "Available Now",
    preOrder: false,
    featured: false,
    buttonText: null,
    createdTime: "2026-02-20T10:00:00.000Z"
  },
  {
    id: "mock-store-static-bloom-cd",
    slug: "static-bloom-cd",
    title: "Static Bloom \u2014 Signed CD",
    artist: { id: "mock-artist-the-north-room", slug: "the-north-room", name: "The North Room" },
    release: { id: "mock-release-static-bloom", slug: "static-bloom", title: "Static Bloom" },
    relatedTracks: [],
    formats: ["CD"],
    prices: {
      CD: "\xA314.00"
    },
    displayPriceSummary: false,
    priceSummary: null,
    purchaseLink: null,
    productImage: image("release-3.jpg"),
    description: "Hand-signed CD edition of the debut album, limited to 200 copies.",
    availability: "Coming Soon",
    preOrder: true,
    featured: false,
    buttonText: null,
    createdTime: "2026-03-25T10:00:00.000Z"
  }
];
var FALLBACK_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
  "X-Data-Source": "mock-fallback"
};
var fallbackHomepage = () => {
  const featuredArtists = fallbackArtists.filter((a) => a.featured).slice(0, 6);
  const latestReleases = fallbackReleases.filter((r) => r.showOnHomepage).slice(0, 6);
  const featuredRelease = fallbackReleases.find((r) => r.featured) ?? latestReleases[0] ?? null;
  return { featuredArtists, latestReleases, featuredRelease };
};
var fallbackArtistPage = (slug) => {
  const artist = fallbackArtists.find((a) => a.slug === slug) ?? fallbackArtists[0];
  if (!artist) return null;
  const discography = fallbackReleases.filter((r) => r.artistSlug === artist.slug).sort((a, b) => +new Date(b.releaseDate) - +new Date(a.releaseDate));
  return { artist, discography };
};
var fallbackReleasePage = (slug) => {
  const release = fallbackReleases.find((r) => r.slug === slug) ?? fallbackReleases[0];
  if (!release) return null;
  const artist = fallbackArtists.find((a) => a.id === release.artistId) ?? null;
  const tracks = fallbackTracks.filter((t) => t.releaseSlug === release.slug).sort((a, b) => a.trackNumber - b.trackNumber);
  const related = fallbackReleases.filter((r) => r.artistSlug === release.artistSlug && r.slug !== slug).slice(0, 3);
  return { release, artist, tracks, related };
};

// api/notion/_schedule.ts
var LONDON = "Europe/London";
var londonParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: LONDON,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
});
function londonOffsetMs(instant) {
  const p = {};
  for (const part of londonParts.formatToParts(instant)) p[part.type] = part.value;
  const asUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour) === 24 ? 0 : Number(p.hour),
    Number(p.minute),
    Number(p.second)
  );
  return asUtc - instant.getTime();
}
var DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
function resolvePublishInstant(value) {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;
  if (DATE_ONLY_RE.test(raw)) {
    const naive = Date.parse(`${raw}T00:00:00Z`);
    if (Number.isNaN(naive)) return null;
    let guess = naive - londonOffsetMs(new Date(naive));
    guess = naive - londonOffsetMs(new Date(guess));
    return guess;
  }
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return null;
  if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw)) {
    let guess = parsed - londonOffsetMs(new Date(parsed));
    guess = parsed - londonOffsetMs(new Date(guess));
    return guess;
  }
  return parsed;
}

// api/notion/_mediaUrls.ts
function slugifyName(raw, fallback = "wmg-image") {
  const slug = (raw ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/['\u2018\u2019\u201b`]/g, "").replace(/&/g, " and ").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return (slug.length > 120 ? slug.slice(0, 120).replace(/-$/, "") : slug) || fallback;
}
var keySegment = (raw) => (raw ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
var compactId = (raw) => (raw ?? "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
function versionToken(isoOrHash) {
  const raw = (isoOrHash ?? "").trim();
  if (!raw) return "";
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (iso) return `${iso[1]}${iso[2]}${iso[3]}T${iso[4]}${iso[5]}${iso[6]}Z`;
  return raw.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16);
}
var withVersion = (path, version) => {
  const v = versionToken(version);
  return v ? `${path}?v=${v}` : path;
};
function artistImageUrl(opts) {
  const key = keySegment(opts.artistSlug);
  if (!key) return "";
  const name = slugifyName(opts.artistName, "wmg-artist");
  if (opts.role === "gallery") {
    const i = Math.max(0, opts.index ?? 0);
    const padded = String(i + 1).padStart(2, "0");
    return withVersion(
      `/media/artists/${key}/gallery/${i}/${name}-gallery-image-${padded}.webp`,
      opts.version ?? ""
    );
  }
  const suffix = opts.role === "hero" ? "hero" : "secondary-image";
  return withVersion(`/media/artists/${key}/${opts.role}/${name}-${suffix}.webp`, opts.version ?? "");
}
var releaseKey = (artistSlug, releaseSlug) => {
  const a = keySegment(artistSlug);
  const r = keySegment(releaseSlug);
  if (!r) return "";
  return a ? `${a}-${r}` : r;
};
function releaseArtworkUrl(opts) {
  const key = releaseKey(opts.artistSlug, opts.releaseSlug);
  if (!key) return "";
  const name = slugifyName(
    [opts.artistName, opts.releaseTitle].filter(Boolean).join(" ") || opts.releaseTitle,
    "wmg-release"
  );
  return withVersion(`/media/releases/${key}/${name}-cover-art.webp`, opts.version ?? "");
}
function storeImageUrl(opts) {
  const key = keySegment(opts.storeKey) || compactId(opts.storeKey);
  if (!key) return "";
  const name = slugifyName(
    [opts.artistName, opts.title].filter(Boolean).join(" ") || opts.title,
    "wmg-store-item"
  );
  return withVersion(`/media/store/${key}/${name}.webp`, opts.version ?? "");
}
function journalCoverUrl(opts) {
  const key = keySegment(opts.articleSlug) || compactId(opts.articleSlug);
  if (!key) return "";
  return withVersion(
    `/media/journal/${key}/cover/${slugifyName(opts.title, "wmg-journal-article")}.webp`,
    opts.version ?? ""
  );
}
function journalBlockImageUrl(opts) {
  const key = keySegment(opts.articleSlug) || compactId(opts.articleSlug);
  const block = compactId(opts.blockId);
  if (!key || !block) return "";
  const padded = String(Math.max(0, opts.index ?? 0) + 1).padStart(2, "0");
  const descriptive = (opts.caption ?? "").trim() ? slugifyName(opts.caption ?? "", "wmg-journal-image") : slugifyName(
    `${opts.articleTitle ?? "wmg journal"} image ${padded}`,
    `wmg-journal-image-${padded}`
  );
  return withVersion(`/media/journal/${key}/images/${block}/${descriptive}.webp`, opts.version ?? "");
}

// api/notion/_notionText.ts
var plain = (items) => Array.isArray(items) ? items.map((t) => t?.plain_text ?? "").join("").trim() : "";
function notionText(p) {
  if (p === null || p === void 0) return "";
  if (typeof p === "string") return p.trim();
  if (typeof p === "number") return String(p);
  if (Array.isArray(p.title)) return plain(p.title);
  if (Array.isArray(p.rich_text)) return plain(p.rich_text);
  const f = p.formula;
  if (f && typeof f === "object") {
    if (typeof f.string === "string") return f.string.trim();
    if (typeof f.number === "number") return String(f.number);
    if (typeof f.boolean === "boolean") return f.boolean ? "true" : "false";
    if (f.date && typeof f.date.start === "string") return f.date.start.trim();
    return "";
  }
  const r = p.rollup;
  if (r && typeof r === "object") {
    if (typeof r.string === "string") return r.string.trim();
    if (typeof r.number === "number") return String(r.number);
    if (r.date && typeof r.date.start === "string") return r.date.start.trim();
    if (Array.isArray(r.array)) {
      for (const entry of r.array) {
        const value = notionText(entry);
        if (value) return value;
      }
    }
    return "";
  }
  if (p.select?.name) return String(p.select.name).trim();
  if (p.status?.name) return String(p.status.name).trim();
  if (Array.isArray(p.multi_select)) {
    return p.multi_select.map((o) => o?.name).filter(Boolean).join(", ");
  }
  if (typeof p.url === "string") return p.url.trim();
  if (typeof p.email === "string") return p.email.trim();
  if (typeof p.phone_number === "string") return p.phone_number.trim();
  if (typeof p.number === "number") return String(p.number);
  if (p.unique_id) {
    const u = p.unique_id;
    return u.prefix ? `${u.prefix}-${u.number}` : String(u.number ?? "");
  }
  if (p.date && typeof p.date.start === "string") return p.date.start.trim();
  return "";
}
function findNotionProp(props, ...names) {
  for (const n of names) if (props?.[n] !== void 0) return props[n];
  const norm = (s) => s.normalize("NFKC").replace(/\s+/g, "").toLowerCase();
  const targets = names.map(norm);
  for (const key of Object.keys(props ?? {})) {
    if (targets.includes(norm(key))) return props[key];
  }
  return void 0;
}

// api/notion/_normalize.ts
var text = notionText;
var findProp = findNotionProp;
var paragraphs = (p) => text(p).split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
var num = (p) => p?.number ?? 0;
var bool = (p) => p?.type === "checkbox" && p.checkbox === true;
var url = (p) => {
  if (!p) return void 0;
  if (typeof p === "string") return p.trim() || void 0;
  if (typeof p.url === "string") return p.url.trim() || void 0;
  if (typeof p[p.type] === "string") return p[p.type].trim() || void 0;
  return void 0;
};
var select = (p) => p?.select?.name ?? "";
var multiSelect = (p) => (p?.multi_select ?? []).map((o) => o.name).filter(Boolean).join(", ");
var date = (p) => p?.date?.start ?? "";
var shouldProxyImageUrl = (rawUrl) => {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === "https:" && parsed.hostname === "prod-files-secure.s3.us-west-2.amazonaws.com";
  } catch {
    return false;
  }
};
var proxiedImageUrl = (rawUrl) => shouldProxyImageUrl(rawUrl) ? `/api/image-proxy?url=${encodeURIComponent(rawUrl)}` : rawUrl;
var fileUrl = (f) => {
  const rawUrl = f?.type === "external" ? f.external.url : f?.file?.url ?? "";
  return rawUrl ? proxiedImageUrl(rawUrl) : "";
};
var files = (p) => (p?.files ?? []).map(fileUrl).filter(Boolean);
var firstFile = (p) => files(p)[0] ?? "";
var titleProp = (props) => Object.values(props).find((p) => p?.type === "title") ?? props["Title"] ?? props["Name"];
function normalizeArtist(page) {
  const props = page.properties;
  const showOnWebsiteProp = props["Show On Website"];
  const showOnWebsite = showOnWebsiteProp === void 0 ? true : bool(showOnWebsiteProp);
  const artistSlug = text(props["Slug"]);
  const artistName = text(props["Name"]);
  const version = String(page.last_edited_time ?? "");
  return {
    id: page.id,
    slug: artistSlug,
    name: artistName,
    genre: multiSelect(props["Genre"]) || select(props["Genre"]) || text(props["Genre"]),
    shortDescription: text(props["Short Description"]),
    fullBio: paragraphs(props["Full Bio"]),
    // Permanent, descriptive same-domain URLs; the proxied Notion URL stays as
    // a fallback only when the artist has no slug to key the media route with.
    heroImage: firstFile(props["Hero Image"]) ? artistImageUrl({ artistSlug, artistName, role: "hero", version }) || firstFile(props["Hero Image"]) : "",
    heroImage2: firstFile(props["Hero Image 2"]) ? artistImageUrl({ artistSlug, artistName, role: "secondary", version }) || firstFile(props["Hero Image 2"]) : "",
    gallery: files(props["Gallery"]).map(
      (fallback, index) => artistImageUrl({ artistSlug, artistName, role: "gallery", index, version }) || fallback
    ),
    featured: bool(props["Featured"]),
    showOnWebsite,
    displayOrder: num(props["Display Order"]),
    accentColour: text(props["Accent Colour"]) || null,
    // Notion formula properties — read through the shared reader (formula.string).
    seoTitle: text(props["SEO Title"]),
    seoDescription: text(props["SEO Description"]),
    artistLinks: {
      // Storefront, not an identity profile — deliberately excluded from sameAs.
      store: url(findProp(props, "Store - Artist URL", "Store Artist URL", "Artist Store URL")),
      youtube: url(findProp(props, "Artist YouTube URL", "YouTube URL")),
      youtubeMusic: url(findProp(props, "Artist YouTube Music URL", "YouTube Music URL")),
      spotify: url(findProp(props, "Artist Spotify URL", "Spotify URL")),
      appleMusic: url(findProp(props, "Artist Apple Music URL", "Apple Music URL")),
      amazonMusic: url(findProp(props, "Artist Amazon Music URL", "Amazon Music URL")),
      instagram: url(findProp(props, "Instagram URL", "Artist Instagram URL")),
      facebook: url(findProp(props, "Facebook URL", "Artist Facebook URL")),
      tiktok: url(findProp(props, "TikTok URL", "Artist TikTok URL"))
    }
  };
}
var warnedShowOnWebsite = /* @__PURE__ */ new Set();
function warnMissingShowOnWebsite(id, title) {
  if (warnedShowOnWebsite.has(id)) return;
  warnedShowOnWebsite.add(id);
  console.warn(
    "[notion-api] Release is missing a recognisable 'Show on website' checkbox \u2014 hidden (fail closed)",
    { id, title: title || "Untitled" }
  );
}
var warnedMissingReleaseDate = /* @__PURE__ */ new Set();
function isReleasePublished(release, now = Date.now()) {
  if (release.showOnWebsite === false) return false;
  const instant = resolvePublishInstant(release.releaseDate);
  if (instant === null) {
    const key = release.id ?? release.slug ?? release.title ?? "";
    if (key && !warnedMissingReleaseDate.has(key)) {
      warnedMissingReleaseDate.add(key);
      console.warn(
        "[notion-api] Releases marked Show on website but missing a valid Release Date (hidden)",
        { id: release.id, slug: release.slug, title: release.title }
      );
    }
    return false;
  }
  return instant <= now;
}
var RELEASE_PARENT_ALBUM_PROP = "parentAlbum";
function normalizeRelease(page, artistLookup) {
  const props = page.properties;
  const artistRel = props["Artist"]?.relation?.[0]?.id ?? "";
  const artist = artistLookup.get(artistRel);
  const showOnWebsiteProp = findProp(props, "Show on website", "Show on Website", "Show On Website");
  const showOnWebsite = showOnWebsiteProp?.type === "checkbox" ? showOnWebsiteProp.checkbox === true : false;
  if (showOnWebsiteProp?.type !== "checkbox") {
    warnMissingShowOnWebsite(page.id, text(titleProp(props)));
  }
  const parentAlbumProp = props[RELEASE_PARENT_ALBUM_PROP];
  if (!parentAlbumProp) {
    throw new Error(
      `[notion] Releases database is missing the relation property "${RELEASE_PARENT_ALBUM_PROP}" (page ${page.id}). It was renamed or removed in Notion \u2014 restore the name or update RELEASE_PARENT_ALBUM_PROP in api/notion/_normalize.ts.`
    );
  }
  const parentAlbumRel = parentAlbumProp.relation?.[0]?.id ?? null;
  return {
    id: page.id,
    slug: text(props["Slug"]),
    title: text(titleProp(props)),
    artistId: artistRel,
    artistSlug: artist?.slug ?? "",
    artistName: artist?.name ?? "",
    releaseDate: date(props["Release Date"]),
    releaseType: select(props["Release Type"]) || "Single",
    coverArt: firstFile(props["Cover Art"]) ? releaseArtworkUrl({
      artistSlug: artist?.slug ?? "",
      releaseSlug: text(props["Slug"]),
      artistName: artist?.name ?? "",
      releaseTitle: text(titleProp(props)),
      version: String(page.last_edited_time ?? "")
    }) || firstFile(props["Cover Art"]) : "",
    shortDescription: text(props["Short Description"]),
    fullDescription: text(props["Full Description"]),
    featured: bool(props["Featured"]),
    showOnHomepage: bool(props["Show on Homepage"]),
    showOnWebsite,
    streamingLinks: {
      spotify: url(props["Spotify URL"]),
      appleMusic: url(props["Apple Music URL"]),
      bandcamp: url(props["Bandcamp URL"]),
      tidal: url(props["Tidal URL"]),
      youtube: url(props["YouTube Music URL"]) || url(props["YouTube URL"]),
      youtubeMusic: url(props["YouTube Music URL"]) || url(props["YouTube URL"]),
      amazonMusic: url(props["Amazon Music URL"])
    },
    catalogueId: text(props["Catalogue ID"]) || null,
    displayOrder: num(props["Display Order"]),
    pLine: text(findProp(props, "\u2117", "P Line", "PLine", "P-Line", "Phonographic")) || null,
    cLine: text(findProp(props, "\xA9", "C Line", "CLine", "C-Line", "Copyright")) || null,
    upc: text(findProp(props, "UPC", "Upc", "upc")) || null,
    parentAlbumId: parentAlbumRel,
    parentAlbum: null,
    /**
     * Releases whose parent-album relation points AT this release (the singles
     * lifted off it). Filled in per-request by the release route; declared here
     * so the property genuinely exists on the normaliser's return type.
     */
    childSingles: [],
    // Notion formula properties — read through the shared reader (formula.string).
    seoTitle: text(props["SEO Title"]),
    seoDescription: text(props["SEO Description"])
  };
}
function normalizeReleaseTrack(page, trackPageLookup) {
  const props = page.properties;
  const releaseRel = props["Release"]?.relation?.[0]?.id ?? "";
  const trackRel = props["Track"]?.relation?.[0]?.id ?? "";
  const trackPage = trackPageLookup.get(trackRel);
  const trackProps = trackPage?.properties ?? {};
  const displayTitle = text(findProp(props, "Name", "Display Title")) || text(titleProp(props));
  const relatedTrackTitle = text(trackProps["Track Title"]) || text(titleProp(trackProps));
  const relatedDuration = text(trackProps["Duration"]) || "";
  return {
    id: page.id,
    releaseId: releaseRel,
    trackId: trackRel,
    trackNumber: num(props["Track Number"]),
    side: text(props["Side"]) || null,
    versionLabel: text(props["Version Label"]) || null,
    displayTitle: displayTitle || null,
    title: displayTitle || relatedTrackTitle,
    duration: relatedDuration,
    // Carry through useful per-track metadata so the Release page UI keeps working.
    lyrics: text(trackProps["Lyrics"]) || null,
    // Per-release Spotify URL only — never fall back to the Tracks DB URL,
    // so a track on multiple releases links to the correct version each time.
    spotifyUrl: url(props["Spotify URL (Release-Specific)"]) || null,
    // YouTube links live on the Tracks DB; allow a per-release override on the pivot row.
    youtubeOfficialAudio: url(findProp(props, "YouTube OA", "YouTube Official Audio")) || url(findProp(trackProps, "YouTube OA", "YouTube Official Audio")) || null,
    youtubeLyricVideo: url(findProp(props, "YouTube OLV", "YouTube Official Lyric Video")) || url(findProp(trackProps, "YouTube OLV", "YouTube Official Lyric Video")) || null,
    youtubeMusicVideo: url(findProp(props, "YouTube OMV", "YouTube Official Music Video")) || url(findProp(trackProps, "YouTube OMV", "YouTube Official Music Video")) || null
  };
}
var dataSourceIdCache = /* @__PURE__ */ new Map();
var canFallbackToDatabaseQuery = (error) => {
  const notionError = error;
  return notionError.status === 404 || notionError.code === "object_not_found" || notionError.code === "validation_error";
};
function formatNotionUuid(id) {
  const cleanId = id.trim();
  const compactId2 = cleanId.replace(/-/g, "");
  if (/^[0-9a-fA-F]{32}$/.test(compactId2)) {
    return [
      compactId2.slice(0, 8),
      compactId2.slice(8, 12),
      compactId2.slice(12, 16),
      compactId2.slice(16, 20),
      compactId2.slice(20)
    ].join("-");
  }
  return cleanId;
}
async function resolveDataSourceId(notion2, dbId) {
  const databaseId = formatNotionUuid(dbId);
  if (!dataSourceIdCache.has(databaseId)) {
    dataSourceIdCache.set(databaseId, (async () => {
      if (!notion2.databases?.retrieve) return dbId;
      try {
        const database = await notion2.databases.retrieve({ database_id: databaseId });
        const dataSourceId = database?.data_sources?.[0]?.id;
        if (!dataSourceId) {
          throw new Error(`No data sources found for Notion database ${databaseId}`);
        }
        return formatNotionUuid(dataSourceId);
      } catch (error) {
        if (!canFallbackToDatabaseQuery(error)) {
          throw error;
        }
        return databaseId;
      }
    })());
  }
  return dataSourceIdCache.get(databaseId);
}
async function loadAll(notion2, dbId) {
  const results = [];
  let cursor;
  const databaseId = formatNotionUuid(dbId);
  const useDatabaseQuery = async () => {
    do {
      const r = await notion2.databases.query({
        database_id: databaseId,
        start_cursor: cursor,
        page_size: 100
      });
      results.push(...r.results);
      cursor = r.has_more ? r.next_cursor : void 0;
    } while (cursor);
    return results;
  };
  if (!notion2.dataSources?.query) return useDatabaseQuery();
  const dataSourceId = await resolveDataSourceId(notion2, databaseId);
  do {
    try {
      const r = await notion2.dataSources.query({
        data_source_id: dataSourceId,
        start_cursor: cursor,
        page_size: 100
      });
      results.push(...r.results);
      cursor = r.has_more ? r.next_cursor : void 0;
    } catch (error) {
      if (!canFallbackToDatabaseQuery(error)) throw error;
      results.length = 0;
      cursor = void 0;
      return useDatabaseQuery();
    }
  } while (cursor);
  return results;
}
var STORE_FORMATS = ["Vinyl", "CD", "iTunes", "Digital", "Merch", "Other"];
var STORE_AVAILABILITIES = ["Available Now", "Coming Soon", "Sold Out", "Hidden"];
var FORMAT_TO_PRICE_PROP = {
  Vinyl: "Price - Vinyl",
  CD: "Price - CD",
  iTunes: "Price - iTunes",
  Digital: "Price - Digital",
  Merch: "Price - Other",
  Other: "Price - Other"
};
function parsePriceNumeric(raw) {
  const m = raw.match(/-?\d+(?:[.,]\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0].replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
function buildPriceSummary(formats, prices) {
  const entries = [];
  for (const f of formats) {
    const raw = prices[f];
    if (!raw) continue;
    const numeric = parsePriceNumeric(raw);
    if (numeric === null) continue;
    entries.push({ raw: raw.trim(), numeric });
  }
  if (entries.length === 0) return null;
  entries.sort((a, b) => a.numeric - b.numeric);
  const cheapest = entries[0].raw;
  if (/^from\b/i.test(cheapest)) return cheapest;
  if (/[£$€¥]/.test(cheapest)) return `From ${cheapest}`;
  return `From \xA3${cheapest}`;
}
function normalizeStoreItem(page, lookups) {
  const props = page.properties;
  const { artistLookup, releaseLookup, trackLookup } = lookups;
  const title = text(titleProp(props));
  const slugText = text(findProp(props, "Store Slug", "Slug"));
  const slug = slugText || null;
  const artistRelId = props["Artist"]?.relation?.[0]?.id ?? "";
  const artistRaw = artistRelId ? artistLookup.get(artistRelId) : null;
  const artist = artistRaw ? { id: artistRaw.id, slug: artistRaw.slug, name: artistRaw.name } : null;
  const releaseRelId = props["Release"]?.relation?.[0]?.id ?? "";
  const releaseRaw = releaseRelId ? releaseLookup.get(releaseRelId) : null;
  const release = releaseRaw ? {
    id: releaseRaw.id,
    slug: releaseRaw.slug,
    title: releaseRaw.title,
    upc: releaseRaw.upc ?? null,
    catalogueId: releaseRaw.catalogueId ?? null
  } : null;
  const relatedTrackRelIds = (props["Related Tracks"]?.relation ?? []).map((r) => r.id);
  const relatedTracks = relatedTrackRelIds.map((id) => trackLookup.get(id)).filter((t) => Boolean(t));
  const formatNames = (props["Format"]?.multi_select ?? []).map((o) => o.name);
  const formats = formatNames.filter(
    (n) => STORE_FORMATS.includes(n)
  );
  const prices = {};
  for (const f of STORE_FORMATS) {
    const raw = text(props[FORMAT_TO_PRICE_PROP[f]]);
    if (raw) prices[f] = raw;
  }
  const displayPriceSummary = bool(props["Display Price Summary"]);
  const priceSummary = displayPriceSummary ? buildPriceSummary(formats, prices) : null;
  const ownProductImage = firstFile(props["Product Image"]);
  const productImage = ownProductImage ? storeImageUrl({
    storeKey: slugText || String(page.id),
    title,
    artistName: artistRaw?.name ?? "",
    version: String(page.last_edited_time ?? "")
  }) || ownProductImage : (releaseRaw?.coverArt ?? "") || "";
  const availRaw = select(props["Availability"]);
  const availability = STORE_AVAILABILITIES.includes(availRaw) ? availRaw : "Coming Soon";
  const purchaseLinkRaw = url(props["Purchase Link"]);
  const buttonTextRaw = text(props["Button Text"]);
  const commentsRaw = text(findProp(props, "Comments", "Comment", "Store Comments"));
  return {
    id: page.id,
    slug,
    title,
    artist,
    release,
    relatedTracks,
    formats,
    prices,
    displayPriceSummary,
    priceSummary,
    purchaseLink: purchaseLinkRaw ?? null,
    productImage,
    description: text(props["Store Description"]),
    availability,
    published: bool(props["Published"]),
    featured: bool(props["Featured"]),
    sortOrder: num(props["Store Sort Order"]),
    buttonText: buttonTextRaw || null,
    comments: commentsRaw || null,
    productType: select(props["Type"]) || null,
    catalogueNumber: text(findProp(props, "Catalogue Number", "Catalogue No", "Catalogue ID", "Cat No", "Catalogue")) || null,
    preOrder: bool(findProp(props, "Pre-order?", "Pre-order", "Preorder", "Pre Order")),
    createdTime: page.created_time ?? ""
  };
}
function normalizeCatalogueTrack(page, lookups) {
  const props = page.properties;
  const { artistLookup, releaseTrackLookup, releaseLookup, youtubeByTrackId } = lookups;
  const artistRelIds = (props["Artist"]?.relation ?? []).map((r) => r.id);
  const artists = artistRelIds.map((id) => artistLookup.get(id)).filter(Boolean).filter((a) => a.showOnWebsite !== false).map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    displayOrder: a.displayOrder ?? 0,
    accentColour: a.accentColour ?? null
  }));
  const appearanceRelIds = (findProp(props, "Release Appearences", "Release Appearances")?.relation ?? []).map((r) => r.id);
  const seenReleases = /* @__PURE__ */ new Set();
  const appearsOn = appearanceRelIds.map((rtId) => releaseTrackLookup.get(rtId)).filter(Boolean).map((rt) => rt.properties?.["Release"]?.relation?.[0]?.id ?? "").filter(Boolean).map((releaseId) => releaseLookup.get(releaseId)).filter(Boolean).filter((rel) => isReleasePublished(rel)).filter((rel) => {
    if (seenReleases.has(rel.id)) return false;
    seenReleases.add(rel.id);
    return true;
  }).map((rel) => ({
    id: rel.id,
    slug: rel.slug,
    title: rel.title,
    coverArt: rel.coverArt ?? "",
    releaseType: rel.releaseType ?? "",
    releaseDate: rel.releaseDate ?? ""
  }));
  return {
    id: page.id,
    title: text(props["Track Title"]) || text(titleProp(props)),
    artists,
    duration: text(props["Duration"]) || "",
    description: text(findProp(props, "Track Description", "Description")) || "",
    lyrics: text(props["Lyrics"]) || "",
    isrc: text(findProp(props, "ISRC", "Isrc")) || "",
    // Optional; absent when no eligible Videos record relates to this track.
    youtubeUrl: youtubeByTrackId?.get(page.id),
    links: {
      spotify: url(props["Spotify URL"]) ?? null,
      appleMusic: url(findProp(props, "Apple Music URL")) ?? null,
      amazonMusic: url(findProp(props, "Amazon Music URL")) ?? null,
      youtubeMusic: url(findProp(props, "YouTube Music URL")) ?? null
    },
    appearsOn
  };
}

// api/notion/_imageHelper.ts
var shouldProxy = (rawUrl) => {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === "https:" && parsed.hostname === "prod-files-secure.s3.us-west-2.amazonaws.com";
  } catch {
    return false;
  }
};
var proxyImageIfNeeded = (rawUrl) => shouldProxy(rawUrl) ? `/api/image-proxy?url=${encodeURIComponent(rawUrl)}` : rawUrl;

// api/notion/_gallery.ts
var slugifyImageTitle = (raw) => slugifyName(raw, "wmg-gallery-image");
var galleryIdSegment = (galleryId) => keySegment(galleryId);
function galleryPublicPath(galleryId, title, version = "") {
  const id = galleryIdSegment(galleryId);
  if (!id) return "";
  const v = versionToken(version);
  return `/media/gallery/${id}/${slugifyImageTitle(title)}.webp${v ? `?v=${v}` : ""}`;
}
var findProp2 = (props, ...names) => {
  for (const n of names) if (props[n] !== void 0) return props[n];
  const norm = (s) => s.normalize("NFKC").replace(/\s+/g, "").toLowerCase();
  const targets = names.map(norm);
  for (const key of Object.keys(props)) {
    if (targets.includes(norm(key))) return props[key];
  }
  return void 0;
};
var text2 = notionText;
var bool2 = (p) => p?.type === "checkbox" && p.checkbox === true;
var date2 = (p) => p?.date?.start ?? "";
var numberOrNull = (p) => {
  if (typeof p?.number === "number") return p.number;
  if (typeof p?.rollup?.number === "number") return p.rollup.number;
  if (typeof p?.formula?.number === "number") return p.formula.number;
  return null;
};
var rawFileUrl = (p) => {
  const first = (p?.files ?? [])[0];
  if (!first) return "";
  const url2 = first.type === "external" ? first.external?.url : first.file?.url;
  return typeof url2 === "string" ? url2.trim() : "";
};
var relationIds = (p) => Array.isArray(p?.relation) ? p.relation.map((r) => r?.id).filter(Boolean) : [];
var uniqueId = (p) => {
  const u = p?.unique_id;
  if (u) return u.prefix ? `${u.prefix}-${u.number}` : String(u.number ?? "");
  if (Array.isArray(p?.rollup?.array)) {
    for (const entry of p.rollup.array) {
      const value = uniqueId(entry);
      if (value) return value;
    }
  }
  return text2(p);
};
function normalizeGalleryImage(page, releaseLookup = /* @__PURE__ */ new Map(), now = Date.now()) {
  const props = page?.properties ?? {};
  const showProp = findProp2(props, "Show on Website", "Show On Website");
  if (!bool2(showProp)) return null;
  const raw = rawFileUrl(findProp2(props, "Image"));
  if (!raw) return null;
  const publishDate = date2(findProp2(props, "Publish Date"));
  if (publishDate) {
    const instant = resolvePublishInstant(publishDate);
    if (instant === null || instant > now) return null;
  }
  const width = numberOrNull(findProp2(props, "Width"));
  const height = numberOrNull(findProp2(props, "Height"));
  const title = text2(findProp2(props, "Image Title", "Title", "Name"));
  const caption = text2(findProp2(props, "Caption"));
  const artistName = text2(findProp2(props, "\u{1F504} Artist Name", "Artist Name"));
  const imageType = text2(findProp2(props, "Image Type"));
  const releaseId = relationIds(findProp2(props, "Related Release"))[0] ?? "";
  const release = releaseId ? releaseLookup.get(releaseId) : void 0;
  const altFallback = caption || [artistName, title].filter(Boolean).join(" \u2014 ") || title || (imageType ? `${imageType} photograph` : "WMG gallery photograph");
  const galleryIdValue = uniqueId(findProp2(props, "\u{1F504} Gallery ID", "Gallery ID")) || String(page.id);
  const fileHash = text2(findProp2(props, "File Hash"));
  const version = fileHash || String(page?.last_edited_time ?? "");
  return {
    id: String(page.id),
    galleryId: galleryIdValue,
    title,
    imageUrl: galleryPublicPath(galleryIdValue, title, version) || proxyImageIfNeeded(raw),
    publicUrl: galleryPublicPath(galleryIdValue, title, version),
    imageSlug: slugifyImageTitle(title),
    width: width && width > 0 ? width : null,
    height: height && height > 0 ? height : null,
    aspectRatio: width && height && width > 0 && height > 0 ? width / height : null,
    artistName,
    artistSlug: text2(findProp2(props, "\u{1F504} Artist Slug", "Artist Slug")),
    imageType,
    caption,
    altText: text2(findProp2(props, "Alt Text")) || altFallback,
    credit: text2(findProp2(props, "Credit")),
    imageDate: date2(findProp2(props, "Image Date")),
    publishDate,
    featured: bool2(findProp2(props, "Featured")),
    sortOrder: numberOrNull(findProp2(props, "Sort Order")),
    focalPoint: text2(findProp2(props, "Focal Point")) || "Centre",
    relatedRelease: release?.title ?? "",
    relatedReleaseUrl: release?.published && release.slug ? `/releases/${release.slug}` : "",
    fileHash
  };
}
function dedupeGalleryImages(items) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const item of items) {
    const key = item.galleryId || item.fileHash || item.id;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
function sortGalleryImages(items) {
  return [...items].sort((a, b) => {
    const ao = a.sortOrder ?? Number.POSITIVE_INFINITY;
    const bo = b.sortOrder ?? Number.POSITIVE_INFINITY;
    if (ao !== bo) return ao - bo;
    const ad = a.imageDate ? Date.parse(a.imageDate) : 0;
    const bd = b.imageDate ? Date.parse(b.imageDate) : 0;
    if (ad !== bd) return bd - ad;
    return a.title.localeCompare(b.title);
  });
}

// api/notion/_videos.ts
var ID_RE = /^[A-Za-z0-9_-]{11}$/;
function extractYouTubeId(raw) {
  if (!raw) return null;
  const value = String(raw).trim();
  if (!value) return null;
  if (ID_RE.test(value)) return value;
  let parsed;
  try {
    parsed = new URL(value.startsWith("http") ? value : `https://${value}`);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  const isYouTube = host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com" || host === "youtube-nocookie.com" || host === "youtu.be";
  if (!isYouTube) return null;
  const fromQuery = parsed.searchParams.get("v");
  if (fromQuery && ID_RE.test(fromQuery)) return fromQuery;
  const segments = parsed.pathname.split("/").filter(Boolean);
  if (host === "youtu.be") {
    const [id] = segments;
    return id && ID_RE.test(id) ? id : null;
  }
  const keyed = ["shorts", "embed", "v", "live"];
  for (let i = 0; i < segments.length; i++) {
    if (keyed.includes(segments[i].toLowerCase())) {
      const id = segments[i + 1];
      return id && ID_RE.test(id) ? id : null;
    }
  }
  return null;
}
var findProp3 = (props, ...names) => {
  for (const n of names) if (props[n] !== void 0) return props[n];
  const norm = (s) => s.normalize("NFKC").replace(/\s+/g, "").toLowerCase();
  const targets = names.map(norm);
  for (const key of Object.keys(props)) {
    if (targets.includes(norm(key))) return props[key];
  }
  return void 0;
};
var text3 = notionText;
var relationIds2 = (p) => Array.isArray(p?.relation) ? p.relation.map((r) => r?.id).filter(Boolean) : [];
function readDuration(prop) {
  const fromNumber = typeof prop?.number === "number" ? prop.number : null;
  const raw = fromNumber !== null ? String(fromNumber) : notionText(prop).trim();
  if (!raw) return "";
  let seconds = null;
  if (/^\d+(\.\d+)?$/.test(raw)) {
    seconds = Math.round(Number(raw));
  } else if (/^PT/i.test(raw)) {
    const m2 = raw.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
    if (m2 && (m2[1] || m2[2] || m2[3])) {
      seconds = Number(m2[1] || 0) * 3600 + Number(m2[2] || 0) * 60 + Number(m2[3] || 0);
    }
  } else if (/^\d{1,2}(:\d{1,2}){1,2}$/.test(raw)) {
    const parts = raw.split(":").map((p) => Number.parseInt(p, 10));
    seconds = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
  }
  if (seconds === null || !Number.isFinite(seconds) || seconds <= 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor(seconds % 3600 / 60);
  const s = seconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
function normalizeVideo(page, artistLookup, now) {
  const props = page?.properties ?? {};
  const showOnWebsiteProp = findProp3(props, "Show on Website", "Show On Website");
  if (showOnWebsiteProp?.checkbox !== true) return null;
  const youtubeUrl = text3(findProp3(props, "YouTube URL"));
  const youtubeId = extractYouTubeId(youtubeUrl);
  if (!youtubeId) return null;
  const releaseDate = findProp3(props, "Release Date")?.date?.start ?? "";
  if (!releaseDate) return null;
  const instant = resolvePublishInstant(releaseDate);
  if (instant === null || instant > now) return null;
  const artistIds = relationIds2(findProp3(props, "Artists", "Artist"));
  const artists = artistIds.map((id) => artistLookup.get(id)).filter(Boolean);
  const sortOrderProp = findProp3(props, "Sort Order");
  const sortOrder = typeof sortOrderProp?.number === "number" ? sortOrderProp.number : null;
  return {
    id: page.id,
    title: text3(findProp3(props, "Video Title", "Title", "Name")),
    youtubeUrl,
    youtubeId,
    videoType: text3(findProp3(props, "Video Type")) || "Other",
    artists,
    relatedTrackIds: relationIds2(findProp3(props, "Related Tracks")),
    relatedReleaseIds: relationIds2(findProp3(props, "Related Release", "Related Releases")),
    releaseDate: releaseDate.slice(0, 10),
    description: text3(findProp3(props, "Description")),
    duration: readDuration(findProp3(props, "Duration", "Length", "Video Duration", "Runtime")),
    featured: findProp3(props, "Featured")?.checkbox === true,
    sortOrder
  };
}
function sortVideos(videos) {
  return [...videos].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    const ao = a.sortOrder ?? Number.POSITIVE_INFINITY;
    const bo = b.sortOrder ?? Number.POSITIVE_INFINITY;
    if (ao !== bo) return ao - bo;
    const ad = a.releaseDate ? Date.parse(a.releaseDate) : 0;
    const bd = b.releaseDate ? Date.parse(b.releaseDate) : 0;
    if (ad !== bd) return bd - ad;
    return a.title.localeCompare(b.title);
  });
}
var TRACK_VIDEO_TYPE_PRIORITY = [
  "Official Music Video",
  "Official Audio",
  "Official Lyric Video"
];
var normalizeType = (value) => value.normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();
var TYPE_RANK = new Map(
  TRACK_VIDEO_TYPE_PRIORITY.map((t, i) => [normalizeType(t), i])
);
function selectTrackYouTubeUrls(videoPages, now) {
  const best = /* @__PURE__ */ new Map();
  for (const page of videoPages ?? []) {
    try {
      const props = page?.properties ?? {};
      if (findProp3(props, "Show on Website", "Show On Website")?.checkbox !== true) continue;
      const youtubeId = extractYouTubeId(notionText(findProp3(props, "YouTube URL")));
      if (!youtubeId) continue;
      const rank = TYPE_RANK.get(normalizeType(notionText(findProp3(props, "Video Type"))));
      if (rank === void 0) continue;
      const releaseDate = findProp3(props, "Release Date")?.date?.start ?? "";
      const instant = resolvePublishInstant(releaseDate);
      if (instant === null || instant > now) continue;
      const sortOrderProp = findProp3(props, "Sort Order");
      const candidate = {
        rank,
        sortOrder: typeof sortOrderProp?.number === "number" ? sortOrderProp.number : Number.POSITIVE_INFINITY,
        releaseInstant: instant,
        id: String(page?.id ?? ""),
        url: `https://www.youtube.com/watch?v=${youtubeId}`
      };
      for (const trackId of relationIds2(findProp3(props, "Related Tracks"))) {
        const current = best.get(trackId);
        if (!current || isBetterCandidate(candidate, current)) best.set(trackId, candidate);
      }
    } catch {
    }
  }
  return new Map([...best].map(([trackId, c]) => [trackId, c.url]));
}
function isBetterCandidate(a, b) {
  if (a.rank !== b.rank) return a.rank < b.rank;
  if (a.sortOrder !== b.sortOrder) return a.sortOrder < b.sortOrder;
  if (a.releaseInstant !== b.releaseInstant) return a.releaseInstant > b.releaseInstant;
  return a.id < b.id;
}

// api/notion/artists.ts
async function loadTrackYouTubeUrls(route) {
  try {
    if (!process.env.NOTION_VIDEOS_DATABASE_ID) return /* @__PURE__ */ new Map();
    const pages = await loadAll(notion, DBS.videos);
    return selectTrackYouTubeUrls(pages, Date.now());
  } catch (e) {
    console.warn("[notion-api] Videos lookup failed; tracks render without YouTube buttons", {
      route,
      error: e?.message ?? String(e)
    });
    return /* @__PURE__ */ new Map();
  }
}
async function handler(req, res) {
  const datasetParam = req?.query?.dataset;
  const dataset = Array.isArray(datasetParam) ? datasetParam[0] : datasetParam;
  if (dataset === "tracks") return handleTracks(res);
  if (dataset === "gallery") return handleGallery(res);
  if (dataset === "catalogue") return handleCatalogue(res);
  return handleArtists(res);
}
async function handleArtists(res) {
  const route = "/api/notion/artists";
  try {
    validateNotionEnv(route);
    const pages = await loadAll(notion, DBS.artists);
    const artists = pages.map(normalizeArtist).filter((a) => a.showOnWebsite !== false).sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
    logApiSuccess(route, { pageCount: pages.length, artistCount: artists.length });
    res.writeHead(200, CACHE_HEADERS).end(JSON.stringify(artists));
  } catch (e) {
    logApiError(route, e);
    logApiFallback(route, e, { fallbackArtistCount: fallbackArtists.length });
    res.writeHead(200, FALLBACK_HEADERS).end(JSON.stringify(fallbackArtists));
  }
}
async function handleTracks(res) {
  const route = "/api/notion/tracks";
  try {
    validateNotionEnv(route);
    const [artistPages, releasePages, trackPages, releaseTrackPages] = await Promise.all([
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases),
      loadAll(notion, DBS.tracks),
      loadAll(notion, DBS.releaseTracks)
    ]);
    const artistLookup = new Map(artistPages.map((p) => [p.id, normalizeArtist(p)]));
    const releaseLookup = new Map(
      releasePages.map((p) => [p.id, normalizeRelease(p, artistLookup)])
    );
    const trackPageLookup = new Map(trackPages.map((p) => [p.id, p]));
    const tracks = releaseTrackPages.map((p) => normalizeReleaseTrack(p, trackPageLookup)).filter((rt) => {
      const rel = releaseLookup.get(rt.releaseId);
      return rel ? isReleasePublished(rel) : false;
    }).map((rt) => {
      const rel = releaseLookup.get(rt.releaseId);
      return {
        id: rt.id,
        trackTitle: rt.title,
        releaseId: rt.releaseId,
        releaseSlug: rel?.slug ?? "",
        releaseTitle: rel?.title ?? "",
        releaseDate: rel?.releaseDate ?? "",
        artistName: rel?.artistName ?? "",
        artistSlug: rel?.artistSlug ?? "",
        trackNumber: rt.trackNumber,
        duration: rt.duration,
        lyrics: rt.lyrics,
        spotifyUrl: rt.spotifyUrl,
        youtubeOfficialAudio: rt.youtubeOfficialAudio,
        youtubeLyricVideo: rt.youtubeLyricVideo,
        youtubeMusicVideo: rt.youtubeMusicVideo,
        side: rt.side,
        versionLabel: rt.versionLabel
      };
    }).sort((a, b) => a.trackNumber - b.trackNumber);
    logApiSuccess(route, {
      artistPageCount: artistPages.length,
      releasePageCount: releasePages.length,
      trackPageCount: trackPages.length,
      releaseTrackPageCount: releaseTrackPages.length,
      trackCount: tracks.length
    });
    res.writeHead(200, RELEASE_CACHE_HEADERS).end(JSON.stringify(tracks));
  } catch (e) {
    logApiError(route, e);
    logApiFallback(route, e, { fallbackTrackCount: fallbackTracks.length });
    res.writeHead(200, FALLBACK_HEADERS).end(JSON.stringify(fallbackTracks));
  }
}
async function handleGallery(res) {
  const route = "/api/notion/gallery";
  try {
    requireEnv(route, ["NOTION_TOKEN", "NOTION_GALLERY_DATABASE_ID"]);
    const [galleryPages, artistPages, releasePages] = await Promise.all([
      loadAll(notion, DBS.gallery),
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases)
    ]);
    const artistLookup = new Map(artistPages.map((p) => [p.id, normalizeArtist(p)]));
    const releaseLookup = new Map(
      releasePages.map((p) => {
        const r = normalizeRelease(p, artistLookup);
        return [p.id, { title: r.title, slug: r.slug, published: isReleasePublished(r) }];
      })
    );
    const now = Date.now();
    const images = sortGalleryImages(
      dedupeGalleryImages(
        galleryPages.map((p) => normalizeGalleryImage(p, releaseLookup, now)).filter((x) => x !== null)
      )
    );
    logApiSuccess(route, { galleryPageCount: galleryPages.length, publishedCount: images.length });
    res.writeHead(200, GALLERY_CACHE_HEADERS).end(JSON.stringify(images));
  } catch (e) {
    logApiError(route, e);
    res.writeHead(500, { "Content-Type": "application/json", "Cache-Control": "no-store" }).end(JSON.stringify({ error: "Gallery is temporarily unavailable." }));
  }
}
async function handleCatalogue(res) {
  const route = "/api/notion/catalogue";
  try {
    validateNotionEnv(route);
    const [artistPages, releasePages, trackPages, releaseTrackPages, youtubeByTrackId] = await Promise.all([
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases),
      loadAll(notion, DBS.tracks),
      loadAll(notion, DBS.releaseTracks),
      loadTrackYouTubeUrls(route)
    ]);
    const artistLookup = new Map(artistPages.map((p) => [p.id, normalizeArtist(p)]));
    const releaseLookup = new Map(
      releasePages.map((p) => [p.id, normalizeRelease(p, artistLookup)])
    );
    const releaseTrackLookup = new Map(releaseTrackPages.map((p) => [p.id, p]));
    const tracks = trackPages.map(
      (p) => normalizeCatalogueTrack(p, { artistLookup, releaseTrackLookup, releaseLookup, youtubeByTrackId })
    ).filter((t) => Boolean(t.title) && Boolean(t.isrc?.trim())).sort(
      (a, b) => (a.artists[0]?.displayOrder ?? 9999) - (b.artists[0]?.displayOrder ?? 9999) || (a.artists[0]?.name ?? "").localeCompare(b.artists[0]?.name ?? "") || a.title.localeCompare(b.title)
    );
    logApiSuccess(route, {
      trackPageCount: trackPages.length,
      catalogueCount: tracks.length,
      tracksWithYouTube: youtubeByTrackId.size
    });
    res.writeHead(200, RELEASE_CACHE_HEADERS).end(JSON.stringify(tracks));
  } catch (e) {
    logApiError(route, e);
    res.writeHead(500, { "Content-Type": "application/json", "Cache-Control": "no-store" }).end(JSON.stringify({ error: "The catalogue is temporarily unavailable." }));
  }
}

// api/notion/homepage.ts
var summarizeCheckbox = (page, propertyName) => ({
  id: page.id,
  name: page.properties?.Name?.title?.[0]?.plain_text ?? page.properties?.Title?.title?.[0]?.plain_text ?? page.properties?.["Track Title"]?.title?.[0]?.plain_text ?? "Untitled",
  propertyType: page.properties?.[propertyName]?.type,
  checkboxValue: page.properties?.[propertyName]?.checkbox
});
async function handler2(_req, res) {
  const route = "/api/notion/homepage";
  try {
    validateNotionEnv(route);
    const [artistPages, releasePages] = await Promise.all([
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases)
    ]);
    console.log("[notion-homepage] raw artist Featured values", artistPages.map((page) => summarizeCheckbox(page, "Featured")));
    console.log("[notion-homepage] raw release Show on Homepage values", releasePages.map((page) => summarizeCheckbox(page, "Show on Homepage")));
    const allArtists = artistPages.map(normalizeArtist);
    const artists = allArtists.filter((a) => a.showOnWebsite !== false);
    const artistLookup = new Map(artists.map((a) => [a.id, a]));
    const releases = releasePages.map((p) => normalizeRelease(p, artistLookup)).filter((r) => artistLookup.has(r.artistId) && isReleasePublished(r));
    console.log("[notion-homepage] normalized artist Featured values", artists.map((artist) => ({
      id: artist.id,
      name: artist.name,
      featured: artist.featured
    })));
    console.log("[notion-homepage] normalized release Show on Homepage values", releases.map((release) => ({
      id: release.id,
      title: release.title,
      showOnHomepage: release.showOnHomepage
    })));
    const featuredArtists = artists.filter((a) => a.featured === true).sort((a, b) => a.displayOrder - b.displayOrder).slice(0, 6);
    const latestReleases = releases.filter((r) => {
      const t = r.releaseDate ? +new Date(r.releaseDate) : NaN;
      return !Number.isNaN(t);
    }).sort((a, b) => +new Date(b.releaseDate) - +new Date(a.releaseDate)).slice(0, 8);
    console.log("[notion-homepage] homepage filter results", {
      featuredArtists: featuredArtists.map((artist) => ({ id: artist.id, name: artist.name, featured: artist.featured })),
      latestReleases: latestReleases.map((release) => ({ id: release.id, title: release.title, showOnHomepage: release.showOnHomepage }))
    });
    const featuredRelease = releases.find((r) => r.featured) ?? latestReleases[0] ?? null;
    logApiSuccess(route, {
      artistPageCount: artistPages.length,
      releasePageCount: releasePages.length,
      artistCount: artists.length,
      releaseCount: releases.length,
      featuredArtistCount: featuredArtists.length,
      latestReleaseCount: latestReleases.length,
      featuredReleaseTitle: featuredRelease?.title ?? null
    });
    res.writeHead(200, RELEASE_CACHE_HEADERS).end(
      JSON.stringify({ featuredArtists, latestReleases, featuredRelease })
    );
  } catch (e) {
    logApiError(route, e);
    logApiFallback(route, e, { fallback: "homepage" });
    res.writeHead(200, FALLBACK_HEADERS).end(JSON.stringify(fallbackHomepage()));
  }
}

// src/lib/truncate.ts
var normalise = (s) => (s || "").replace(/\s+/g, " ").replace(/[\s.…]*…\s*$/, "").trim();
var truncateAtWord = (s, max = 155) => {
  const t = normalise(s);
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:–—-]+$/, "");
};

// api/notion/_journal.ts
var text4 = notionText;
var num2 = (p) => p?.number ?? 0;
var bool3 = (p) => p?.type === "checkbox" && p.checkbox === true;
var select2 = (p) => p?.select?.name ?? "";
var date3 = (p) => p?.date?.start ?? "";
var fileUrl2 = (f) => {
  const raw = f?.type === "external" ? f.external.url : f?.file?.url ?? "";
  return raw ? proxyImageIfNeeded(raw) : "";
};
var firstFile2 = (p) => (p?.files ?? []).map(fileUrl2).filter(Boolean)[0] ?? "";
var relationIds3 = (p) => (p?.relation ?? []).map((r) => r.id);
function normalizeJournal(page) {
  const props = page.properties ?? {};
  const titleProp2 = Object.values(props).find((p) => p?.type === "title") ?? props["Title"] ?? props["Name"];
  const publishDate = date3(props["Publish Date"] ?? props["Published Date"]) || null;
  return {
    id: page.id,
    slug: text4(props["Slug"]) || page.id,
    title: text4(titleProp2) || "Untitled",
    category: select2(props["Category"]) || text4(props["Category"]),
    artistIds: relationIds3(props["Artist"] ?? props["Artists"]),
    releaseIds: relationIds3(props["Releases"] ?? props["Release"]),
    trackIds: relationIds3(props["Track"] ?? props["Tracks"]),
    album: text4(props["Album"]),
    publishedDate: publishDate ?? "",
    publishDate,
    coverImage: firstFile2(props["Cover Image"]) ? journalCoverUrl({
      articleSlug: text4(props["Slug"]) || page.id,
      title: text4(titleProp2) || "Untitled",
      version: String(page.last_edited_time ?? "")
    }) || firstFile2(props["Cover Image"]) : "",
    excerpt: text4(props["Excerpt"]),
    summary: text4(props["Summary"]),
    readingTime: num2(props["Reading Time"]),
    published: bool3(props["Published"]),
    featured: bool3(props["Featured"]),
    seoTitle: text4(props["SEO Title"]),
    seoDescription: text4(props["SEO Description"]),
    canonicalUrl: (props["Canonical URL"]?.url ?? "").toString().trim(),
    noindex: bool3(props["Noindex"]),
    socialCaption: text4(props["Social Caption"]),
    imageAlt: text4(props["Image Alt Text"]),
    createdTime: page.created_time ?? "",
    lastEditedTime: page.last_edited_time ?? ""
  };
}
function isJournalPublished(article, now = Date.now()) {
  if (!article.published) return false;
  const instant = resolvePublishInstant(article.publishDate);
  if (instant === null) return false;
  return instant <= now;
}
var richFrom = (rt = []) => rt.map((t) => ({
  text: t.plain_text ?? "",
  bold: t.annotations?.bold,
  italic: t.annotations?.italic,
  underline: t.annotations?.underline,
  code: t.annotations?.code,
  href: t.href ?? null
}));
var plainCaption = (rt = []) => rt.map((t) => t.plain_text ?? "").join("");
async function listChildren(notion2, blockId) {
  const out = [];
  let cursor;
  do {
    const r = await notion2.blocks.children.list({ block_id: blockId, start_cursor: cursor, page_size: 100 });
    out.push(...r.results);
    cursor = r.has_more ? r.next_cursor : void 0;
  } while (cursor);
  return out;
}
async function fetchPageBlocks(notion2, pageId, article) {
  const raw = await listChildren(notion2, pageId);
  const blocks = [];
  let listBuffer = null;
  const flushList = () => {
    if (!listBuffer) return;
    blocks.push(
      listBuffer.kind === "bulleted" ? { type: "bulleted_list", items: listBuffer.items } : { type: "numbered_list", items: listBuffer.items }
    );
    listBuffer = null;
  };
  for (const b of raw) {
    const t = b.type;
    if (t === "bulleted_list_item" || t === "numbered_list_item") {
      const kind = t === "bulleted_list_item" ? "bulleted" : "numbered";
      if (!listBuffer || listBuffer.kind !== kind) {
        flushList();
        listBuffer = { kind, items: [] };
      }
      listBuffer.items.push(richFrom(b[t]?.rich_text ?? []));
      continue;
    }
    flushList();
    switch (t) {
      case "paragraph":
        blocks.push({ type: "paragraph", rich: richFrom(b.paragraph?.rich_text ?? []) });
        break;
      case "heading_1":
      case "heading_2":
        blocks.push({ type: "heading_2", rich: richFrom(b[t]?.rich_text ?? []) });
        break;
      case "heading_3":
        blocks.push({ type: "heading_3", rich: richFrom(b.heading_3?.rich_text ?? []) });
        break;
      case "quote":
        blocks.push({ type: "quote", rich: richFrom(b.quote?.rich_text ?? []) });
        break;
      case "divider":
        blocks.push({ type: "divider" });
        break;
      case "image": {
        const img = b.image;
        const raw2 = img?.type === "external" ? img.external?.url : img?.file?.url;
        if (raw2) {
          blocks.push({
            type: "image",
            // Replaced below with the permanent /media/journal/... URL once
            // bracket captions have been resolved (they feed the filename).
            url: proxyImageIfNeeded(raw2),
            caption: plainCaption(img?.caption ?? []),
            alt: plainCaption(img?.caption ?? []) || "Article image",
            blockId: String(b.id ?? ""),
            blockVersion: String(b.last_edited_time ?? "")
          });
        }
        break;
      }
      default:
        break;
    }
  }
  flushList();
  return withPermanentImageUrls(applyBracketCaptions(blocks), article, pageId);
}
function withPermanentImageUrls(blocks, article, pageId) {
  let index = 0;
  return blocks.map((b) => {
    if (b.type !== "image") return b;
    const i = index++;
    const permanent = journalBlockImageUrl({
      articleSlug: article?.slug || pageId,
      blockId: b.blockId ?? "",
      caption: b.caption,
      articleTitle: article?.title,
      index: i,
      version: b.blockVersion
    });
    const { blockVersion: _v, ...rest } = b;
    return permanent ? { ...rest, url: permanent } : rest;
  });
}
var CAPTION_RE = /^\[\s*caption\s*:\s*([\s\S]*?)\s*\]$/i;
function applyBracketCaptions(blocks) {
  const out = [];
  for (const b of blocks) {
    const prev = out[out.length - 1];
    if (prev && prev.type === "image" && b.type === "paragraph") {
      const plain2 = b.rich.map((r) => r.text).join("").trim();
      const m = plain2.match(CAPTION_RE);
      if (m && m[1].trim()) {
        out[out.length - 1] = { ...prev, caption: m[1].trim() };
        continue;
      }
    }
    out.push(b);
  }
  return out;
}
function estimateReadingTime(blocks) {
  const words = blocks.flatMap((b) => {
    if ("rich" in b) return b.rich.map((r) => r.text);
    if (b.type === "bulleted_list" || b.type === "numbered_list")
      return b.items.flatMap((i) => i.map((r) => r.text));
    return [];
  }).join(" ").trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}
function deriveExcerpt(blocks, len = 155) {
  for (const b of blocks) {
    if (b.type === "paragraph") {
      const txt = b.rich.map((r) => r.text).join("").replace(/\s+/g, " ").trim();
      if (!txt) continue;
      return truncateAtWord(txt, len);
    }
  }
  return "";
}

// api/notion/journal.ts
async function handler3(_req, res) {
  const route = "/api/notion/journal";
  try {
    requireEnv(route, ["NOTION_TOKEN", "NOTION_JOURNAL_DB_ID", "NOTION_ARTISTS_DB_ID", "NOTION_RELEASES_DB_ID"]);
    const [journalPages, artistPages, releasePages] = await Promise.all([
      loadAll(notion, DBS.journal),
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases)
    ]);
    const artists = artistPages.map(normalizeArtist);
    const artistMap = new Map(artists.map((a) => [a.id, a]));
    const releases = releasePages.map((p) => normalizeRelease(p, artistMap)).filter((r) => isReleasePublished(r));
    const releaseMap = new Map(releases.map((r) => [r.id, r]));
    const now = Date.now();
    const allArticles = journalPages.map(normalizeJournal);
    const missingPublishDate = allArticles.filter((a) => a.published && !a.publishDate).map((a) => a.slug);
    if (missingPublishDate.length > 0) {
      console.warn("[notion-api] Journal articles marked Published but missing a Publish Date (hidden)", {
        route,
        slugs: missingPublishDate
      });
    }
    const articles = allArticles.filter((a) => isJournalPublished(a, now) && !a.noindex).map((a) => ({
      ...a,
      artists: a.artistIds.map((id) => artistMap.get(id)).filter(Boolean).map((x) => ({ id: x.id, slug: x.slug, name: x.name })),
      releases: a.releaseIds.map((id) => releaseMap.get(id)).filter(Boolean).map((x) => ({ id: x.id, slug: x.slug, title: x.title, coverArt: x.coverArt }))
    })).sort((a, b) => {
      const ad = a.publishedDate || a.lastEditedTime || a.createdTime;
      const bd = b.publishedDate || b.lastEditedTime || b.createdTime;
      return +new Date(bd) - +new Date(ad);
    });
    logApiSuccess(route, { count: articles.length });
    res.writeHead(200, JOURNAL_CACHE_HEADERS).end(JSON.stringify(articles));
  } catch (e) {
    logApiError(route, e);
    res.writeHead(200, FALLBACK_HEADERS).end(JSON.stringify([]));
  }
}

// api/notion/journal/[slug].ts
async function handler4(req, res) {
  const route = "/api/notion/journal/[slug]";
  const slug = String(req.query.slug ?? "");
  try {
    requireEnv(route, ["NOTION_TOKEN", "NOTION_JOURNAL_DB_ID", "NOTION_ARTISTS_DB_ID", "NOTION_RELEASES_DB_ID"]);
    const [journalPages, artistPages, releasePages] = await Promise.all([
      loadAll(notion, DBS.journal),
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases)
    ]);
    const articles = journalPages.map(normalizeJournal);
    const article = articles.find((a) => a.slug === slug);
    if (!article || !isJournalPublished(article)) return res.status(404).json(null);
    const blocks = await fetchPageBlocks(notion, article.id, { slug: article.slug, title: article.title });
    const artists = artistPages.map(normalizeArtist);
    const artistMap = new Map(artists.map((a) => [a.id, a]));
    const releases = releasePages.map((p) => normalizeRelease(p, artistMap)).filter((r) => isReleasePublished(r));
    const releaseMap = new Map(releases.map((r) => [r.id, r]));
    const relatedArtists = article.artistIds.map((id) => artistMap.get(id)).filter(Boolean);
    const relatedReleases = article.releaseIds.map((id) => releaseMap.get(id)).filter(Boolean);
    const excerpt = article.excerpt || deriveExcerpt(blocks);
    const readingTime = article.readingTime > 0 ? article.readingTime : estimateReadingTime(blocks);
    res.writeHead(200, JOURNAL_CACHE_HEADERS).end(JSON.stringify({
      article: { ...article, excerpt, readingTime },
      blocks,
      relatedArtists,
      relatedReleases
    }));
  } catch (e) {
    logApiError(route, e, { slug });
    res.writeHead(404, FALLBACK_HEADERS).end(JSON.stringify(null));
  }
}

// api/notion/releases.ts
async function handler5(_req, res) {
  const route = "/api/notion/releases";
  try {
    validateNotionEnv(route);
    const [artistPages, releasePages] = await Promise.all([
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases)
    ]);
    const artistLookup = new Map(
      artistPages.map((p) => normalizeArtist(p)).filter((a) => a.showOnWebsite !== false).map((a) => [a.id, a])
    );
    const releases = releasePages.map((p) => normalizeRelease(p, artistLookup)).filter((r) => artistLookup.has(r.artistId) && isReleasePublished(r)).sort((a, b) => +new Date(b.releaseDate) - +new Date(a.releaseDate));
    logApiSuccess(route, { artistPageCount: artistPages.length, releasePageCount: releasePages.length, releaseCount: releases.length });
    res.writeHead(200, RELEASE_CACHE_HEADERS).end(JSON.stringify(releases));
  } catch (e) {
    logApiError(route, e);
    logApiFallback(route, e, { fallbackReleaseCount: fallbackReleases.length });
    res.writeHead(200, FALLBACK_HEADERS).end(JSON.stringify(fallbackReleases));
  }
}

// api/notion/release/[slug].ts
async function handler6(req, res) {
  const route = "/api/notion/release/[slug]";
  const { slug } = req.query;
  try {
    validateNotionEnv(route);
    const [artistPages, releasePages, trackPages, releaseTrackPages] = await Promise.all([
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases),
      loadAll(notion, DBS.tracks),
      loadAll(notion, DBS.releaseTracks)
    ]);
    const artists = artistPages.map(normalizeArtist);
    const artistLookup = new Map(artists.map((a) => [a.id, a]));
    const releases = releasePages.map((p) => normalizeRelease(p, artistLookup));
    const release = releases.find((r) => r.slug === slug);
    if (!release || !isReleasePublished(release)) return res.status(404).json(null);
    const releaseArtist = artists.find((a) => a.id === release.artistId) ?? null;
    if (releaseArtist && releaseArtist.showOnWebsite === false) return res.status(404).json(null);
    if (release.parentAlbumId) {
      const parent = releases.find((r) => r.id === release.parentAlbumId);
      if (parent && isReleasePublished(parent)) {
        release.parentAlbum = { id: parent.id, title: parent.title, slug: parent.slug || null };
      } else if (parent) {
        release.parentAlbum = { id: parent.id, title: parent.title, slug: null };
      } else {
        release.parentAlbum = null;
      }
    } else {
      release.parentAlbum = null;
    }
    release.childSingles = releases.filter((r) => r.parentAlbumId === release.id && r.id !== release.id && isReleasePublished(r)).map((r) => ({ id: r.id, title: r.title, slug: r.slug || null }));
    const trackPageLookup = new Map(trackPages.map((p) => [p.id, p]));
    const tracks = releaseTrackPages.map((p) => normalizeReleaseTrack(p, trackPageLookup)).filter((rt) => rt.releaseId === release.id).sort((a, b) => a.trackNumber - b.trackNumber).map((rt) => ({
      id: rt.id,
      trackTitle: rt.title,
      releaseId: rt.releaseId,
      releaseSlug: release.slug,
      trackNumber: rt.trackNumber,
      duration: rt.duration,
      lyrics: rt.lyrics,
      spotifyUrl: rt.spotifyUrl,
      side: rt.side,
      versionLabel: rt.versionLabel
    }));
    const artist = artists.find((a) => a.id === release.artistId) ?? null;
    const related = releases.filter((r) => r.artistSlug === release.artistSlug && r.slug !== slug && isReleasePublished(r)).sort((a, b) => +new Date(b.releaseDate) - +new Date(a.releaseDate)).slice(0, 3);
    res.writeHead(200, RELEASE_CACHE_HEADERS).end(
      JSON.stringify({ release, artist, tracks, related })
    );
  } catch (e) {
    logApiError(route, e, { slug });
    const fallback = fallbackReleasePage(String(slug ?? ""));
    if (!fallback) return res.status(404).json(null);
    res.writeHead(200, FALLBACK_HEADERS).end(JSON.stringify(fallback));
  }
}

// api/notion/artist/[slug].ts
async function handler7(req, res) {
  const route = "/api/notion/artist/[slug]";
  const { slug } = req.query;
  try {
    validateNotionEnv(route);
    const [artistPages, releasePages] = await Promise.all([
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases)
    ]);
    const artists = artistPages.map(normalizeArtist);
    const artist = artists.find((a) => a.slug === slug);
    if (!artist || artist.showOnWebsite === false) return res.status(404).json(null);
    const artistLookup = new Map(artists.map((a) => [a.id, a]));
    const discography = releasePages.map((p) => normalizeRelease(p, artistLookup)).filter((r) => r.artistSlug === slug && isReleasePublished(r)).sort((a, b) => +new Date(b.releaseDate) - +new Date(a.releaseDate));
    res.writeHead(200, RELEASE_CACHE_HEADERS).end(JSON.stringify({ artist, discography }));
  } catch (e) {
    logApiError(route, e, { slug });
    const fallback = fallbackArtistPage(String(slug ?? ""));
    if (!fallback) return res.status(404).json(null);
    res.writeHead(200, FALLBACK_HEADERS).end(JSON.stringify(fallback));
  }
}

// api/notion/store.ts
async function handler8(_req, res) {
  const route = "/api/notion/store";
  try {
    requireEnv(route, ["NOTION_TOKEN", "NOTION_ARTISTS_DB_ID", "NOTION_RELEASES_DB_ID", "NOTION_TRACKS_DB_ID", "NOTION_STORE_DB_ID", "NOTION_RELEASE_TRACKS_DB_ID"]);
    const [artistPages, releasePages, trackPages, storePages, releaseTrackPages] = await Promise.all([
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases),
      loadAll(notion, DBS.tracks),
      loadAll(notion, DBS.storeItems),
      loadAll(notion, DBS.releaseTracks)
    ]);
    const trackCountByRelease = /* @__PURE__ */ new Map();
    for (const rt of releaseTrackPages) {
      const releaseId = rt?.properties?.["Release"]?.relation?.[0]?.id;
      if (!releaseId) continue;
      trackCountByRelease.set(releaseId, (trackCountByRelease.get(releaseId) ?? 0) + 1);
    }
    const artistLookup = new Map(artistPages.map((p) => [p.id, normalizeArtist(p)]));
    const releaseLookup = new Map(
      releasePages.map((p) => [p.id, normalizeRelease(p, artistLookup)])
    );
    const trackLookup = /* @__PURE__ */ new Map();
    for (const t of trackPages) {
      const props = t.properties ?? {};
      const titleField = props["Track Title"] ?? Object.values(props).find((p) => p?.type === "title");
      const title = notionText(titleField);
      trackLookup.set(t.id, { id: t.id, title });
    }
    const normalized = storePages.map(
      (p) => normalizeStoreItem(p, { artistLookup, releaseLookup, trackLookup })
    );
    const items = normalized.filter((s) => s.published === true && s.availability !== "Hidden").sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      const ta = new Date(a.createdTime).getTime() || 0;
      const tb = new Date(b.createdTime).getTime() || 0;
      return tb - ta;
    });
    const payload = items.map(({ published, sortOrder, ...rest }) => {
      if (!rest.release) return rest;
      const linked = releaseLookup.get(rest.release.id);
      const eligible = linked ? isReleasePublished(linked) : false;
      const release = {
        ...rest.release,
        slug: eligible ? rest.release.slug : "",
        trackCount: trackCountByRelease.get(rest.release.id) ?? 0
      };
      return { ...rest, release };
    });
    logApiSuccess(route, {
      storePageCount: storePages.length,
      itemCount: payload.length
    });
    res.writeHead(200, CACHE_HEADERS).end(JSON.stringify(payload));
  } catch (e) {
    logApiError(route, e);
    logApiFallback(route, e, { fallbackStoreCount: fallbackStoreItems.length });
    res.writeHead(200, FALLBACK_HEADERS).end(JSON.stringify(fallbackStoreItems));
  }
}

// api/notion/videos.ts
async function handler9(_req, res) {
  const route = "/api/notion/videos";
  try {
    requireEnv(route, ["NOTION_TOKEN", "NOTION_VIDEOS_DATABASE_ID", "NOTION_ARTISTS_DB_ID"]);
    const [videoPages, artistPages] = await Promise.all([
      loadAll(notion, DBS.videos),
      loadAll(notion, DBS.artists)
    ]);
    const artistLookup = new Map(
      artistPages.map((p) => {
        const a = normalizeArtist(p);
        return [p.id, { id: a.id, name: a.name, slug: a.slug || void 0 }];
      })
    );
    const now = Date.now();
    const videos = sortVideos(
      videoPages.map((p) => {
        try {
          return normalizeVideo(p, artistLookup, now);
        } catch (err) {
          console.warn("[notion-api] Skipping malformed video row", { route, id: p?.id, err });
          return null;
        }
      }).filter((v) => v !== null)
    );
    logApiSuccess(route, { videoPageCount: videoPages.length, publishedCount: videos.length });
    res.writeHead(200, VIDEO_CACHE_HEADERS).end(JSON.stringify(videos));
  } catch (e) {
    logApiError(route, e);
    res.writeHead(500, { "Content-Type": "application/json", "Cache-Control": "no-store" }).end(JSON.stringify({ error: "Videos are temporarily unavailable." }));
  }
}

// api/notion/_dispatch.ts
function makeRes(resolve) {
  return {
    status: (code) => ({
      json: (body) => resolve({ status: code, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    }),
    writeHead: (code, headers) => ({
      end: (body) => resolve({ status: code, headers, body })
    })
  };
}
function resolveRoute(pathname) {
  const segs = pathname.replace(/^\/+|\/+$/g, "").split("/");
  if (segs[0] !== "api" || segs[1] !== "notion") return null;
  const rest = segs.slice(2);
  if (rest.length === 1) {
    switch (rest[0]) {
      case "artists":
        return { handler, query: {} };
      // vercel.json rewrites these three onto the artists function.
      case "tracks":
        return { handler, query: { dataset: "tracks" } };
      case "catalogue":
        return { handler, query: { dataset: "catalogue" } };
      case "gallery":
        return { handler, query: { dataset: "gallery" } };
      case "homepage":
        return { handler: handler2, query: {} };
      case "journal":
        return { handler: handler3, query: {} };
      case "releases":
        return { handler: handler5, query: {} };
      case "store":
        return { handler: handler8, query: {} };
      case "videos":
        return { handler: handler9, query: {} };
      default:
        return null;
    }
  }
  if (rest.length === 2) {
    const slug = decodeURIComponent(rest[1]);
    if (rest[0] === "artist") return { handler: handler7, query: { slug } };
    if (rest[0] === "release") return { handler: handler6, query: { slug } };
    if (rest[0] === "journal") return { handler: handler4, query: { slug } };
  }
  return null;
}
async function callApi(pathWithQuery) {
  const [pathname, search = ""] = pathWithQuery.split("?");
  const match = resolveRoute(pathname);
  if (!match) throw new Error(`[api-dispatch] no handler for "${pathWithQuery}"`);
  const query = { ...match.query };
  for (const [k, v] of new URLSearchParams(search)) query[k] = v;
  let settle;
  const done = new Promise((resolve) => {
    settle = resolve;
  });
  await match.handler({ query }, makeRes(settle));
  return done;
}
var dispatch_default = callApi;
export {
  callApi,
  dispatch_default as default
};
