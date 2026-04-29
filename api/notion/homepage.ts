import { notion, DBS, CACHE_HEADERS, logApiError, logApiFallback, logApiSuccess, validateNotionEnv, type ApiResponse } from "./_client.js";
import { FALLBACK_HEADERS, fallbackHomepage } from "./_fallback.js";
import { loadAll, normalizeArtist, normalizeRelease } from "./_normalize.js";

const summarizeCheckbox = (page: any, propertyName: string) => ({
  id: page.id,
  name: page.properties?.Name?.title?.[0]?.plain_text
    ?? page.properties?.Title?.title?.[0]?.plain_text
    ?? page.properties?.["Track Title"]?.title?.[0]?.plain_text
    ?? "Untitled",
  propertyType: page.properties?.[propertyName]?.type,
  checkboxValue: page.properties?.[propertyName]?.checkbox,
});

export default async function handler(_req: unknown, res: ApiResponse) {
  const route = "/api/notion/homepage";
  try {
    validateNotionEnv(route);
    const [artistPages, releasePages] = await Promise.all([
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases),
    ]);

    console.log("[notion-homepage] raw artist Featured values", artistPages.map((page) => summarizeCheckbox(page, "Featured")));
    console.log("[notion-homepage] raw release Show on Homepage values", releasePages.map((page) => summarizeCheckbox(page, "Show on Homepage")));

    const artists = artistPages.map(normalizeArtist);
    const artistLookup = new Map(artists.map((a) => [a.id, a]));
    const releases = releasePages.map((p) => normalizeRelease(p, artistLookup));

    console.log("[notion-homepage] normalized artist Featured values", artists.map((artist) => ({
      id: artist.id,
      name: artist.name,
      featured: artist.featured,
    })));
    console.log("[notion-homepage] normalized release Show on Homepage values", releases.map((release) => ({
      id: release.id,
      title: release.title,
      showOnHomepage: release.showOnHomepage,
    })));

    const featuredArtists = artists
      .filter((a) => a.featured === true)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .slice(0, 6);

    const latestReleases = releases
      .filter((r) => r.showOnHomepage === true)
      .sort((a, b) => +new Date(b.releaseDate) - +new Date(a.releaseDate))
      .slice(0, 6);

    console.log("[notion-homepage] homepage filter results", {
      featuredArtists: featuredArtists.map((artist) => ({ id: artist.id, name: artist.name, featured: artist.featured })),
      latestReleases: latestReleases.map((release) => ({ id: release.id, title: release.title, showOnHomepage: release.showOnHomepage })),
    });

    const featuredRelease = releases.find((r) => r.featured) ?? latestReleases[0] ?? null;

    logApiSuccess(route, {
      artistPageCount: artistPages.length,
      releasePageCount: releasePages.length,
      artistCount: artists.length,
      releaseCount: releases.length,
      featuredArtistCount: featuredArtists.length,
      latestReleaseCount: latestReleases.length,
      featuredReleaseTitle: featuredRelease?.title ?? null,
    });

    res.writeHead(200, CACHE_HEADERS).end(
      JSON.stringify({ featuredArtists, latestReleases, featuredRelease }),
    );
  } catch (e: unknown) {
    logApiError(route, e);
    logApiFallback(route, e, { fallback: "homepage" });
    res.writeHead(200, FALLBACK_HEADERS).end(JSON.stringify(fallbackHomepage()));
  }
}
