import { lazy, Suspense, type ComponentType } from "react";
import { Route, Routes } from "react-router-dom";

type Loader = () => Promise<{ default: ComponentType<unknown> }>;

/**
 * Single source of truth for the route table.
 *
 * In the browser each page is code-split via React.lazy. During build-time
 * pre-rendering (SSR) every page module is preloaded first with
 * `preloadAllPages()` so routes render synchronously into static HTML.
 */
const loaders: Record<string, Loader> = {
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

const preloaded: Record<string, ComponentType<unknown>> = {};

export async function preloadAllPages() {
  await Promise.all(
    Object.entries(loaders).map(async ([name, load]) => {
      preloaded[name] = (await load()).default;
    }),
  );
}

const lazyCache: Record<string, ComponentType<unknown>> = {};
const getLazy = (name: string) => (lazyCache[name] ??= lazy(loaders[name]));

const Page = ({ name }: { name: keyof typeof loaders }) => {
  const Ready = preloaded[name];
  if (Ready) return <Ready />;
  const Lazy = getLazy(name);
  return (
    <Suspense fallback={null}>
      <Lazy />
    </Suspense>
  );
};

export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Page name="Index" />} />
    <Route path="/artists" element={<Page name="Artists" />} />
    <Route path="/artists/:slug" element={<Page name="ArtistPage" />} />
    <Route path="/releases" element={<Page name="Releases" />} />
    <Route path="/releases/:slug" element={<Page name="ReleasePage" />} />
    <Route path="/gallery" element={<Page name="Gallery" />} />
    <Route path="/videos" element={<Page name="Videos" />} />
    <Route path="/music" element={<Page name="Music" />} />
    <Route path="/journal" element={<Page name="Journal" />} />
    <Route path="/journal/category/:slug" element={<Page name="JournalCategory" />} />
    <Route path="/journal/:slug" element={<Page name="JournalArticlePage" />} />
    <Route path="/store" element={<Page name="Store" />} />
    <Route path="/about" element={<Page name="About" />} />
    <Route path="/contact" element={<Page name="Contact" />} />
    <Route path="/newsletter" element={<Page name="Newsletter" />} />
    <Route path="/legal/:doc" element={<Page name="Legal" />} />
    <Route path="/seo-diagnostics" element={<Page name="SeoDiagnostics" />} />
    <Route path="/media-library" element={<Page name="MediaLibrary" />} />
    <Route path="*" element={<Page name="NotFound" />} />
  </Routes>
);
