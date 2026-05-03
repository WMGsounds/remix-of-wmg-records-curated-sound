import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteHeader, SiteFooter } from "@/components/Layout";
import { ScrollToTop } from "@/components/ScrollToTop";
import Index from "./pages/Index.tsx";
import ArtistPage from "./pages/ArtistPage.tsx";
import ReleasePage from "./pages/ReleasePage.tsx";
import About from "./pages/About.tsx";
import Contact from "./pages/Contact.tsx";
import Newsletter from "./pages/Newsletter.tsx";
import Legal from "./pages/Legal.tsx";
import NotFound from "./pages/NotFound.tsx";

const Artists = lazy(() => import("./pages/Artists.tsx"));
const Releases = lazy(() => import("./pages/Releases.tsx"));
const Journal = lazy(() => import("./pages/Journal.tsx"));
const JournalArticlePage = lazy(() => import("./pages/JournalArticlePage.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <SiteHeader />
        <main>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/artists" element={<Suspense fallback={null}><Artists /></Suspense>} />
            <Route path="/artists/:slug" element={<ArtistPage />} />
            <Route path="/releases" element={<Suspense fallback={null}><Releases /></Suspense>} />
            <Route path="/releases/:slug" element={<ReleasePage />} />
            <Route path="/journal" element={<Suspense fallback={null}><Journal /></Suspense>} />
            <Route path="/journal/:slug" element={<Suspense fallback={null}><JournalArticlePage /></Suspense>} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/newsletter" element={<Newsletter />} />
            <Route path="/legal/:doc" element={<Legal />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <SiteFooter />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
