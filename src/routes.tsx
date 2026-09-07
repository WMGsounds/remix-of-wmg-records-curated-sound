import { lazy, Suspense, type ComponentType } from "react";
import { Route, Routes } from "react-router-dom";
import { routeRegistry, type PageName } from "@/lib/routeRegistry";

type Loader = () => Promise<{ default: ComponentType<unknown> }>;

/**
 * Route table, generated from the central registry (src/lib/routeRegistry.ts).
 *
 * In the browser each page is code-split via React.lazy. During build-time
 * pre-rendering (SSR) every page module is preloaded first with
 * `preloadAllPages()` so routes render synchronously into static HTML.
 */
const loaders: Record<PageName, Loader> = {
  Index: () => import("./pages/Index.tsx"),
  ArtistPage: () => import("./pages/ArtistPage.tsx"),
  ReleasePage: () => import("./pages/ReleasePage.tsx"),
  About: () => import("./pages/About.tsx"),
  Contact: () => import("./pages/Contact.tsx"),
  Newsletter: () => import("./pages/Newsletter.tsx"),
  Legal: () => import("./pages/Legal.tsx"),
  NotFound: () => import("./pages/NotFound.tsx"),
  Artists: () => import("./pages/Artists.tsx"),
  Releases: () => import("./pages/Releases.tsx"),
  Gallery: () => import("./pages/Gallery.tsx"),
  Videos: () => import("./pages/Videos.tsx"),
  Music: () => import("./pages/Music.tsx"),
  Journal: () => import("./pages/Journal.tsx"),
  JournalArticlePage: () => import("./pages/JournalArticlePage.tsx"),
  JournalCategory: () => import("./pages/JournalCategory.tsx"),
  Store: () => import("./pages/Store.tsx"),
  
  SeoDiagnostics: () => import("./pages/SeoDiagnostics.tsx"),
  MediaLibrary: () => import("./pages/MediaLibrary.tsx"),
};

const preloaded: Partial<Record<PageName, ComponentType<unknown>>> = {};

/** Load every page module up front so SSR can render without Suspense. */
export async function preloadAllPages(): Promise<void> {
  await Promise.all(
    (Object.entries(loaders) as [PageName, Loader][]).map(async ([name, load]) => {
      preloaded[name] = (await load()).default;
    }),
  );
}

const lazyCache: Partial<Record<PageName, ComponentType<unknown>>> = {};
const getLazy = (name: PageName) => (lazyCache[name] ??= lazy(loaders[name]));

const Page = ({ name }: { name: PageName }) => {
  const Ready = preloaded[name];
  if (Ready) return <Ready />;
  const Lazy = getLazy(name);
  return (
    <Suspense fallback={null}>
      <Lazy />
    </Suspense>
  );
};

/** Page component names actually wired into the router (build assertions). */
export const pageNames = Object.keys(loaders) as PageName[];

export const AppRoutes = () => (
  <Routes>
    {routeRegistry.map((entry) => (
      <Route key={entry.path} path={entry.path} element={<Page name={entry.page} />} />
    ))}
  </Routes>
);
