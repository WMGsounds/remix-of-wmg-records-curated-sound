import { Helmet } from "react-helmet-async";
import { organization, website } from "@/lib/schema";

/**
 * Organization + WebSite JSON-LD, emitted ONCE from the root layout.
 * No page may emit these — duplication is structurally impossible.
 */
export const SiteSchema = () => (
  <Helmet>
    <script type="application/ld+json" data-seo="site-organization">
      {JSON.stringify(organization())}
    </script>
    <script type="application/ld+json" data-seo="site-website">
      {JSON.stringify(website())}
    </script>
  </Helmet>
);
