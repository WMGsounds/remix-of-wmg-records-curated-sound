// Convert Notion property objects into the clean shape src/lib/types.ts expects.

const text = (p: any): string => {
  if (!p) return "";
  if (Array.isArray(p?.rich_text)) return p.rich_text.map((t: any) => t.plain_text).join("").trim();
  if (Array.isArray(p?.title)) return p.title.map((t: any) => t.plain_text).join("").trim();
  if (typeof p?.formula?.string === "string") return p.formula.string.trim();
  if (typeof p?.formula?.number === "number") return String(p.formula.number);
  if (typeof p?.rollup?.string === "string") return p.rollup.string.trim();
  if (typeof p?.rollup?.number === "number") return String(p.rollup.number);
  if (typeof p?.number === "number") return String(p.number);
  if (typeof p?.email === "string") return p.email.trim();
  if (typeof p?.phone_number === "string") return p.phone_number.trim();
  if (typeof p?.url === "string") return p.url.trim();
  if (p?.select?.name) return String(p.select.name).trim();
  return "";
};

// Look up a Notion property by name, tolerant to unicode variants/whitespace.
const findProp = (props: Record<string, any>, ...names: string[]): any => {
  for (const n of names) {
    if (props[n] !== undefined) return props[n];
  }
  const norm = (s: string) => s.normalize("NFKC").replace(/\s+/g, "").toLowerCase();
  const targets = names.map(norm);
  for (const key of Object.keys(props)) {
    if (targets.includes(norm(key))) return props[key];
  }
  return undefined;
};

const paragraphs = (p: any): string[] =>
  text(p).split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);

const num = (p: any): number => p?.number ?? 0;
const bool = (p: any): boolean => p?.type === "checkbox" && p.checkbox === true;
const url = (p: any): string | undefined => {
  if (!p) return undefined;
  if (typeof p === "string") return p.trim() || undefined;
  if (typeof p.url === "string") return p.url.trim() || undefined;
  if (typeof p[p.type] === "string") return p[p.type].trim() || undefined;
  return undefined;
};
const select = (p: any): string => p?.select?.name ?? "";
const multiSelect = (p: any): string => (p?.multi_select ?? []).map((o: any) => o.name).filter(Boolean).join(", ");
const date = (p: any): string => p?.date?.start ?? "";

const shouldProxyImageUrl = (rawUrl: string): boolean => {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === "https:" && parsed.hostname === "prod-files-secure.s3.us-west-2.amazonaws.com";
  } catch {
    return false;
  }
};

const proxiedImageUrl = (rawUrl: string): string =>
  shouldProxyImageUrl(rawUrl) ? `/api/image-proxy?url=${encodeURIComponent(rawUrl)}` : rawUrl;

const fileUrl = (f: any): string => {
  const rawUrl = f?.type === "external" ? f.external.url : f?.file?.url ?? "";
  return rawUrl ? proxiedImageUrl(rawUrl) : "";
};

const files = (p: any): string[] => (p?.files ?? []).map(fileUrl).filter(Boolean);
const firstFile = (p: any): string => files(p)[0] ?? "";
const titleProp = (props: Record<string, any>): any =>
  Object.values(props).find((p: any) => p?.type === "title") ?? props["Title"] ?? props["Name"];

export function normalizeArtist(page: any) {
  const props = page.properties;
  // Default to true if the property is missing entirely (e.g. older rows
  // before the column existed) so we don't hide artists unintentionally.
  const showOnWebsiteProp = props["Show On Website"];
  const showOnWebsite = showOnWebsiteProp === undefined ? true : bool(showOnWebsiteProp);
  return {
    id: page.id,
    slug: text(props["Slug"]),
    name: text(props["Name"]),
    genre: multiSelect(props["Genre"]) || select(props["Genre"]) || text(props["Genre"]),
    shortDescription: text(props["Short Description"]),
    fullBio: paragraphs(props["Full Bio"]),
    heroImage: firstFile(props["Hero Image"]),
    heroImage2: firstFile(props["Hero Image 2"]),
    gallery: files(props["Gallery"]),
    featured: bool(props["Featured"]),
    showOnWebsite,
    displayOrder: num(props["Display Order"]),
    accentColour: text(props["Accent Colour"]) || null,
  };
}

export function normalizeRelease(page: any, artistLookup: Map<string, any>) {
  const props = page.properties;
  const artistRel = props["Artist"]?.relation?.[0]?.id ?? "";
  const artist = artistLookup.get(artistRel);
  // Default to true if the property is missing entirely (e.g. older rows
  // before the column existed) so we don't hide releases unintentionally.
  const showOnWebsiteProp = props["Show on Website"] ?? props["Show On Website"];
  const showOnWebsite = showOnWebsiteProp === undefined ? true : bool(showOnWebsiteProp);
  const parentAlbumRel =
    props["Album"]?.relation?.[0]?.id ??
    props["Parent Album"]?.relation?.[0]?.id ??
    props["Related Album"]?.relation?.[0]?.id ??
    props["From Album"]?.relation?.[0]?.id ??
    null;
  return {
    id: page.id,
    slug: text(props["Slug"]),
    title: text(titleProp(props)),
    artistId: artistRel,
    artistSlug: artist?.slug ?? "",
    artistName: artist?.name ?? "",
    releaseDate: date(props["Release Date"]),
    releaseType: select(props["Release Type"]) || "Single",
    coverArt: firstFile(props["Cover Art"]),
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
      amazonMusic: url(props["Amazon Music URL"]),
    },
    catalogueId: text(props["Catalogue ID"]) || null,
    displayOrder: num(props["Display Order"]),
    pLine: text(findProp(props, "℗", "P Line", "PLine", "P-Line", "Phonographic")) || null,
    cLine: text(findProp(props, "©", "C Line", "CLine", "C-Line", "Copyright")) || null,
    upc: text(findProp(props, "UPC", "Upc", "upc")) || null,
    parentAlbumId: parentAlbumRel,
    parentAlbum: null as null | { id: string; title: string; slug: string | null },
  };
}

export function normalizeTrack(page: any, releaseLookup: Map<string, any>) {
  const props = page.properties;
  const releaseRel = props["Release"]?.relation?.[0]?.id ?? "";
  const release = releaseLookup.get(releaseRel);
  return {
    id: page.id,
    trackTitle: text(props["Track Title"]) || text(titleProp(props)),
    releaseId: releaseRel,
    releaseSlug: release?.slug ?? "",
    trackNumber: num(props["Track Number"]),
    duration: text(props["Duration"]) || "",
    lyrics: text(props["Lyrics"]) || null,
    spotifyUrl: url(props["Spotify URL"]) || null,
  };
}

// Release Tracks DB: pivot rows that place one Track on one Release with
// per-release metadata (track number, side, version label, display title).
export function normalizeReleaseTrack(page: any, trackPageLookup: Map<string, any>) {
  const props = page.properties;
  const releaseRel = props["Release"]?.relation?.[0]?.id ?? "";
  const trackRel = props["Track"]?.relation?.[0]?.id ?? "";
  const trackPage = trackPageLookup.get(trackRel);
  const trackProps = trackPage?.properties ?? {};

  const displayTitle = text(props["Display Title"]);
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
  };
}

const dataSourceIdCache = new Map<string, Promise<string>>();

type NotionApiError = { status?: number; code?: string };

const canFallbackToDatabaseQuery = (error: unknown) => {
  const notionError = error as NotionApiError;
  return notionError.status === 404
    || notionError.code === "object_not_found"
    || notionError.code === "validation_error";
};

export function formatNotionUuid(id: string) {
  const cleanId = id.trim();
  const compactId = cleanId.replace(/-/g, "");

  if (/^[0-9a-fA-F]{32}$/.test(compactId)) {
    return [
      compactId.slice(0, 8),
      compactId.slice(8, 12),
      compactId.slice(12, 16),
      compactId.slice(16, 20),
      compactId.slice(20),
    ].join("-");
  }

  return cleanId;
}

async function resolveDataSourceId(notion: any, dbId: string) {
  const databaseId = formatNotionUuid(dbId);

  if (!dataSourceIdCache.has(databaseId)) {
    dataSourceIdCache.set(databaseId, (async () => {
      if (!notion.databases?.retrieve) return dbId;

      try {
        const database = await notion.databases.retrieve({ database_id: databaseId });
        const dataSourceId = database?.data_sources?.[0]?.id;
        if (!dataSourceId) {
          throw new Error(`No data sources found for Notion database ${databaseId}`);
        }
        return formatNotionUuid(dataSourceId);
      } catch (error: unknown) {
        if (!canFallbackToDatabaseQuery(error)) {
          throw error;
        }
        return databaseId;
      }
    })());
  }

  return dataSourceIdCache.get(databaseId)!;
}

export async function loadAll(notion: any, dbId: string) {
  const results: any[] = [];
  let cursor: string | undefined;
  const databaseId = formatNotionUuid(dbId);
  const useDatabaseQuery = async () => {
    do {
      const r = await notion.databases.query({
        database_id: databaseId,
        start_cursor: cursor,
        page_size: 100,
      });
      results.push(...r.results);
      cursor = r.has_more ? r.next_cursor : undefined;
    } while (cursor);
    return results;
  };

  if (!notion.dataSources?.query) return useDatabaseQuery();

  const dataSourceId = await resolveDataSourceId(notion, databaseId);
  do {
    try {
      const r = await notion.dataSources.query({
        data_source_id: dataSourceId,
        start_cursor: cursor,
        page_size: 100,
      });
      results.push(...r.results);
      cursor = r.has_more ? r.next_cursor : undefined;
    } catch (error: unknown) {
      if (!canFallbackToDatabaseQuery(error)) throw error;
      results.length = 0;
      cursor = undefined;
      return useDatabaseQuery();
    }
  } while (cursor);
  return results;
}

// ---------- Store ----------

const STORE_FORMATS = ["Vinyl", "CD", "iTunes", "Digital", "Merch", "Other"] as const;
type StoreFormatLocal = (typeof STORE_FORMATS)[number];
const STORE_AVAILABILITIES = ["Available Now", "Coming Soon", "Sold Out", "Hidden"] as const;

const FORMAT_TO_PRICE_PROP: Record<StoreFormatLocal, string> = {
  Vinyl: "Price - Vinyl",
  CD: "Price - CD",
  iTunes: "Price - iTunes",
  Digital: "Price - Digital",
  Merch: "Price - Other",
  Other: "Price - Other",
};

function parsePriceNumeric(raw: string): number | null {
  const m = raw.match(/-?\d+(?:[.,]\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0].replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function buildPriceSummary(formats: StoreFormatLocal[], prices: Partial<Record<StoreFormatLocal, string>>): string | null {
  const entries: { raw: string; numeric: number }[] = [];
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
  return `From £${cheapest}`;
}

export function normalizeStoreItem(
  page: any,
  lookups: {
    artistLookup: Map<string, any>;
    releaseLookup: Map<string, any>;
    trackLookup: Map<string, { id: string; title: string }>;
  },
) {
  const props = page.properties;
  const { artistLookup, releaseLookup, trackLookup } = lookups;

  const title = text(titleProp(props));
  const slugText = text(findProp(props, "Store Slug", "Slug"));
  const slug = slugText || null;

  const artistRelId = props["Artist"]?.relation?.[0]?.id ?? "";
  const artistRaw = artistRelId ? artistLookup.get(artistRelId) : null;
  const artist = artistRaw
    ? { id: artistRaw.id, slug: artistRaw.slug, name: artistRaw.name }
    : null;

  const releaseRelId = props["Release"]?.relation?.[0]?.id ?? "";
  const releaseRaw = releaseRelId ? releaseLookup.get(releaseRelId) : null;
  const release = releaseRaw
    ? { id: releaseRaw.id, slug: releaseRaw.slug, title: releaseRaw.title }
    : null;

  const relatedTrackRelIds: string[] = (props["Related Tracks"]?.relation ?? []).map((r: any) => r.id);
  const relatedTracks = relatedTrackRelIds
    .map((id) => trackLookup.get(id))
    .filter((t): t is { id: string; title: string } => Boolean(t));

  const formatNames: string[] = (props["Format"]?.multi_select ?? []).map((o: any) => o.name);
  const formats = formatNames.filter((n): n is StoreFormatLocal =>
    (STORE_FORMATS as readonly string[]).includes(n),
  );

  const prices: Partial<Record<StoreFormatLocal, string>> = {};
  for (const f of STORE_FORMATS) {
    const raw = text(props[FORMAT_TO_PRICE_PROP[f]]);
    if (raw) prices[f] = raw;
  }

  const displayPriceSummary = bool(props["Display Price Summary"]);
  const priceSummary = displayPriceSummary ? buildPriceSummary(formats, prices) : null;

  const productImage =
    firstFile(props["Product Image"]) ||
    (releaseRaw?.coverArt ?? "") ||
    "";

  const availRaw = select(props["Availability"]);
  const availability = (STORE_AVAILABILITIES as readonly string[]).includes(availRaw)
    ? (availRaw as (typeof STORE_AVAILABILITIES)[number])
    : "Coming Soon";

  const purchaseLinkRaw = url(props["Purchase Link"]);
  const buttonTextRaw = text(props["Button Text"]);

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
  };
}

