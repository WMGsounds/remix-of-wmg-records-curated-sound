import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "./App";
import { preloadAllPages, pageNames } from "./routes";
import { resolveRoutes, resolveSitemapRoutes, routeRegistry, type RouteContent } from "@/lib/routeRegistry";
import { seoKeys } from "@/lib/seoConfig";
import { SITE_URL } from "@/lib/seo";
import {
  fetchArtists,
  fetchReleases,
  fetchTracks,
  fetchHomepageData,
  fetchArtistBySlug,
  fetchReleaseBySlug,
  fetchJournal,
  fetchJournalBySlug,
  fetchStoreItems,
  fetchGallery,
  fetchVideos,
  fetchCatalogue,
} from "@/lib/api";

export { preloadAllPages };

/** Consistency inputs consumed by the build assertions in scripts/prerender.mjs. */
export const registry = { routeRegistry, seoKeys, pageNames };

/* ------------------------------------------------------------------ *
 * Route + sitemap discovery.
 *
 * Both the pre-rendered file set and sitemap.xml come from ONE expansion of
 * the central registry (src/lib/routeRegistry.ts) against live CMS content.
 * Nothing here is hand-listed, so a new artist, release, journal article or
 * legal document is pre-rendered AND listed in the sitemap with no edits.
 * ------------------------------------------------------------------ */

export type SitemapImage = { loc: string; title?: string; caption?: string };
export type SitemapEntry = { path: string; lastmod?: string; images: SitemapImage[] };
export type SiteRoutes = { routes: string[]; sitemap: SitemapEntry[] };

const mediaImages = (
  items: { url?: string; title?: string; caption?: string }[],
): SitemapImage[] =>
  items
    .map((i) => ({ ...i, loc: (i.url || "").split("?")[0] }))
    // Only permanent, public /media/* URLs belong in the sitemap.
    .filter((i) => i.loc.startsWith("/media/"))
    .map(({ loc, title, caption }) => ({ loc, title: title || undefined, caption: caption || undefined }));

export async function collectSite(): Promise<SiteRoutes> {
  const [artists, releases, journal, gallery, store] = await Promise.all([
    fetchArtists().catch(() => []),
    fetchReleases().catch(() => []),
    fetchJournal().catch(() => []),
    fetchGallery().catch(() => []),
    fetchStoreItems().catch(() => []),
  ]);

  const content = {
    artists: artists as RouteContent["artists"],
    releases: releases as RouteContent["releases"],
    journal: journal as RouteContent["journal"],
  };

  
  const imagesByPath = new Map<string, SitemapImage[]>();

  imagesByPath.set(
    "/gallery",
    mediaImages(
      (gallery as any[]).map((g) => ({
        url: g.publicUrl || g.imageUrl,
        title: g.title,
        caption: g.caption,
      })),
    ),
  );
  imagesByPath.set(
    "/store",
    mediaImages(
      (store as any[])
        .filter((i) => i && i.availability !== "Hidden" && i.productImage)
        .map((i) => ({
          url: i.productImage,
          title: [i.artist?.name, i.title].filter(Boolean).join(" \u2014 ") || i.title,
          caption: i.description,
        })),
    ),
  );
  for (const a of artists as any[]) {
    imagesByPath.set(
      `/artists/${a.slug}`,
      mediaImages([
        { url: a.heroImage, title: `${a.name} \u2014 hero image` },
        { url: a.heroImage2, title: `${a.name} \u2014 photograph` },
        ...((a.gallery || []) as string[]).map((u, i) => ({
          url: u,
          title: `${a.name} \u2014 gallery ${i + 1}`,
        })),
      ]),
    );
  }
  for (const r of releases as any[]) {
    imagesByPath.set(
      `/releases/${r.slug}`,
      mediaImages([{ url: r.coverArt, title: `${r.title} \u2014 cover art`, caption: r.artistName }]),
    );
  }
  for (const j of journal as any[]) {
    imagesByPath.set(
      `/journal/${j.slug}`,
      mediaImages([{ url: j.coverImage, title: j.title, caption: j.imageAlt || j.excerpt }]),
    );
  }

  return {
    routes: resolveRoutes(content).map((r) => r.path),
    sitemap: resolveSitemapRoutes(content).map((r) => ({
      path: r.path,
      // lastmod only where a real content timestamp exists. Static pages get
      // theirs from the source file's last git commit date in
      // scripts/prerender.mjs — never the build date, which would falsely
      // re-date every page on every deploy. No priority/changefreq: Google
      // ignores both.
      lastmod: r.lastmod ? r.lastmod.split("T")[0] : undefined,
      images: imagesByPath.get(r.path) || [],
    })),
  };
}


/** Kept for callers that only need the pre-render list. */
export async function collectRoutes(): Promise<string[]> {
  return (await collectSite()).routes;
}

const escapeXml = (s: string) =>
  s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] as string,
  );

/** sitemap.xml, built from the exact list of routes that were pre-rendered. */
export function renderSitemap(entries: SitemapEntry[], base = SITE_URL): string {
  const urls = entries.map((e) => {
    const images = e.images
      .map(
        (img) =>
          `\n    <image:image>\n      <image:loc>${escapeXml(base + img.loc)}</image:loc>${
            img.title ? `\n      <image:title>${escapeXml(img.title)}</image:title>` : ""
          }${img.caption ? `\n      <image:caption>${escapeXml(img.caption)}</image:caption>` : ""}\n    </image:image>`,
      )
      .join("");
    return `  <url>\n    <loc>${escapeXml(base + e.path)}</loc>${
      e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ""
    }${images}\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>`;
}

type PrefetchTask = { key: unknown[]; fn: () => Promise<unknown> };

function tasksForRoute(url: string): PrefetchTask[] {
  const path = url.split("?")[0].replace(/\/$/, "") || "/";
  const seg = path.split("/").filter(Boolean);
  const t: PrefetchTask[] = [];

  const artists = { key: ["artists"], fn: fetchArtists };
  const releases = { key: ["releases"], fn: fetchReleases };
  const journal = { key: ["journal"], fn: fetchJournal };
  const store = { key: ["storeItems"], fn: fetchStoreItems };
  const gallery = { key: ["gallery"], fn: fetchGallery };

  if (path === "/") t.push({ key: ["homepage"], fn: fetchHomepageData }, artists, releases, store);
  else if (path === "/artists") t.push(artists);
  else if (path === "/releases") t.push(releases, artists);
  else if (path === "/journal") t.push(journal);
  else if (path === "/store") t.push(store, releases, artists);
  else if (path === "/gallery") t.push(gallery, artists);
  else if (path === "/videos") t.push({ key: ["videos"], fn: fetchVideos }, artists);
  else if (path === "/music")
    t.push({ key: ["catalogue"], fn: fetchCatalogue }, { key: ["tracks"], fn: fetchTracks }, artists);
  else if (seg[0] === "artists" && seg[1])
    t.push({ key: ["artist", seg[1]], fn: () => fetchArtistBySlug(seg[1]) }, gallery, store, releases);
  else if (seg[0] === "releases" && seg[1])
    t.push({ key: ["release", seg[1]], fn: () => fetchReleaseBySlug(seg[1]) }, releases, artists);
  else if (seg[0] === "journal" && seg[1] === "category") t.push(journal);
  else if (seg[0] === "journal" && seg[1])
    t.push({ key: ["journal", seg[1]], fn: () => fetchJournalBySlug(seg[1]) }, journal);

  return t;
}

export type RenderResult = {
  html: string;
  head: string;
  htmlAttributes: string;
  bodyAttributes: string;
};

export async function render(url: string): Promise<RenderResult> {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity, staleTime: Infinity } },
  });

  await Promise.all(
    tasksForRoute(url).map((task) =>
      queryClient.prefetchQuery({ queryKey: task.key, queryFn: task.fn }).catch(() => undefined),
    ),
  );

  const helmetContext: { helmet?: Record<string, { toString(): string }> } = {};

  const html = renderToString(
    <HelmetProvider context={helmetContext as never}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <StaticRouter location={url}>
            <AppShell />
          </StaticRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>,
  );

  const h = helmetContext.helmet ?? {};
  const head = ["title", "priority", "meta", "link", "script", "style", "base", "noscript"]
    .map((k) => (h[k] ? h[k].toString() : ""))
    .filter(Boolean)
    .join("\n    ");

  return {
    html,
    head,
    htmlAttributes: h.htmlAttributes ? h.htmlAttributes.toString() : "",
    bodyAttributes: h.bodyAttributes ? h.bodyAttributes.toString() : "",
  };
}
