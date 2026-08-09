import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "./App";
import { preloadAllPages } from "./routes";
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

const STATIC_ROUTES = [
  "/",
  "/artists",
  "/releases",
  "/journal",
  "/store",
  "/gallery",
  "/videos",
  "/music",
  "/about",
  "/spotify",
  "/contact",
  "/newsletter",
  "/legal/privacy",
  "/legal/terms",
  "/legal/cookies",
];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** Discover every public route: static pages plus all published CMS entries. */
export async function collectRoutes(): Promise<string[]> {
  const [artists, releases, journal] = await Promise.all([
    fetchArtists().catch(() => []),
    fetchReleases().catch(() => []),
    fetchJournal().catch(() => []),
  ]);

  const categories = new Set<string>();
  for (const a of journal as { category?: string }[]) {
    if (a.category) categories.add(slugify(a.category));
  }

  const routes = [
    ...STATIC_ROUTES,
    ...[...categories].map((c) => `/journal/category/${c}`),
    ...(artists as { slug: string }[]).map((a) => `/artists/${a.slug}`),
    ...(releases as { slug: string }[]).map((r) => `/releases/${r.slug}`),
    ...(journal as { slug: string }[]).map((a) => `/journal/${a.slug}`),
  ].filter(Boolean);

  return [...new Set(routes)];
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
