// Convert Notion property objects into the clean shape src/lib/types.ts expects.

const text = (p: any): string =>
  (p?.rich_text ?? p?.title ?? []).map((t: any) => t.plain_text).join("").trim();

const paragraphs = (p: any): string[] =>
  text(p).split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);

const num = (p: any): number => p?.number ?? 0;
const bool = (p: any): boolean => !!p?.checkbox;
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

async function resolveDataSourceId(notion: any, dbId: string) {
  if (!dataSourceIdCache.has(dbId)) {
    dataSourceIdCache.set(dbId, (async () => {
      if (!notion.databases?.retrieve) return dbId;

      try {
        const database = await notion.databases.retrieve({ database_id: dbId });
        const dataSourceId = database?.data_sources?.[0]?.id;
        if (!dataSourceId) {
          throw new Error(`No data sources found for Notion database ${dbId}`);
        }
        return dataSourceId;
      } catch (error: any) {
        if (error?.status !== 404 && error?.code !== "object_not_found") {
          throw error;
        }
        return dbId;
      }
    })());
  }

  return dataSourceIdCache.get(dbId)!;
}

export async function loadAll(notion: any, dbId: string) {
  const results: any[] = [];
  let cursor: string | undefined;
  const dataSourceId = notion.dataSources?.query ? await resolveDataSourceId(notion, dbId) : dbId;
  do {
    const r = notion.dataSources?.query
      ? await notion.dataSources.query({
        data_source_id: dataSourceId,
        start_cursor: cursor,
        page_size: 100,
      })
      : await notion.databases.query({
        database_id: dbId,
        start_cursor: cursor,
        page_size: 100,
      });
    results.push(...r.results);
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return results;
}
