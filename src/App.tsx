import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteHeader, SiteFooter } from "@/components/Layout";
import { ScrollToTop } from "@/components/ScrollToTop";
import Index from "./pages/Index.tsx";
import Artists from "./pages/Artists.tsx";
import ArtistPage from "./pages/ArtistPage.tsx";
import Releases from "./pages/Releases.tsx";
import ReleasePage from "./pages/ReleasePage.tsx";
import About from "./pages/About.tsx";
import Contact from "./pages/Contact.tsx";
import Newsletter from "./pages/Newsletter.tsx";
import Legal from "./pages/Legal.tsx";
import NotFound from "./pages/NotFound.tsx";

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
            <Route path="/artists" element={<Artists />} />
            <Route path="/artists/:slug" element={<ArtistPage />} />
            <Route path="/releases" element={<Releases />} />
            <Route path="/releases/:slug" element={<ReleasePage />} />
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
