import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteHeader, SiteFooter } from "@/components/Layout";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AppRoutes } from "./routes";

/** Everything inside the router — shared by the browser app and the pre-renderer. */
export const AppShell = () => (
  <>
    <ScrollToTop />
    <SiteHeader />
    <main>
      <AppRoutes />
    </main>
    <SiteFooter />
  </>
);

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
