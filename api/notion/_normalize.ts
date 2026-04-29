// Convert Notion property objects into the clean shape src/lib/types.ts expects.

const text = (p: any): string =>
  (p?.rich_text ?? p?.title ?? []).map((t: any) => t.plain_text).join("").trim();

const paragraphs = (p: any): string[] =>
  text(p).split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);

const num = (p: any): number => p?.number ?? 0;
const bool = (p: any): boolean => p?.type === "checkbox" && p.checkbox === true;
const url = (p: any): string | undefined => p?.url ?? undefined;
const select = (p: any): string => p?.select?.name ?? "";
const multiSelect = (p: any): string => (p?.multi_select ?? []).map((o: any) => o.name).filter(Boolean).join(", ");
const date = (p: any): string => p?.date?.start ?? "";

const fileUrl = (f: any): string =>
  f?.type === "external" ? f.external.url : f?.file?.url ?? "";

const files = (p: any): string[] => (p?.files ?? []).map(fileUrl).filter(Boolean);
const firstFile = (p: any): string => files(p)[0] ?? "";
const titleProp = (props: Record<string, any>): any =>
  Object.values(props).find((p: any) => p?.type === "title") ?? props["Title"] ?? props["Name"];

export function normalizeArtist(page: any) {
  const props = page.properties;
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
    displayOrder: num(props["Display Order"]),
    accentColour: text(props["Accent Colour"]) || null,
  };
}

export function normalizeRelease(page: any, artistLookup: Map<string, any>) {
  const props = page.properties;
  const artistRel = props["Artist"]?.relation?.[0]?.id ?? "";
  const artist = artistLookup.get(artistRel);
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
