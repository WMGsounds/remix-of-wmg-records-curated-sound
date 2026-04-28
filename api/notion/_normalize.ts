// Convert Notion property objects into the clean shape src/lib/types.ts expects.

const text = (p: any): string =>
  (p?.rich_text ?? p?.title ?? []).map((t: any) => t.plain_text).join("").trim();

const paragraphs = (p: any): string[] =>
  text(p).split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);

const num = (p: any): number => p?.number ?? 0;
const bool = (p: any): boolean => !!p?.checkbox;
const url = (p: any): string | undefined => p?.url ?? undefined;
const select = (p: any): string => p?.select?.name ?? "";
const date = (p: any): string => p?.date?.start ?? "";

const fileUrl = (f: any): string =>
  f?.type === "external" ? f.external.url : f?.file?.url ?? "";

const files = (p: any): string[] => (p?.files ?? []).map(fileUrl).filter(Boolean);
const firstFile = (p: any): string => files(p)[0] ?? "";

export function normalizeArtist(page: any) {
  const props = page.properties;
  return {
    id: page.id,
    slug: text(props["Slug"]),
    name: text(props["Name"]),
    genre: select(props["Genre"]) || text(props["Genre"]),
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
    title: text(props["Title"]),
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
      youtube: url(props["YouTube URL"]),
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
    trackTitle: text(props["Track Title"]),
    releaseId: releaseRel,
    releaseSlug: release?.slug ?? "",
    trackNumber: num(props["Track Number"]),
    duration: text(props["Duration"]) || "",
    lyrics: text(props["Lyrics"]) || null,
  };
}

export async function loadAll(notion: any, dbId: string) {
  const results: any[] = [];
  let cursor: string | undefined;
  do {
    const r = await notion.databases.query({
      database_id: dbId,
      start_cursor: cursor,
      page_size: 100,
    });
    results.push(...r.results);
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return results;
}
