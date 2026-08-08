import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import {
  SITE_NAME,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  BRAND_SUFFIX,
  absoluteUrl,
  buildTitle,
  clampDescription,
} from "@/lib/seo";

/**
 * Site-wide head tags.
 *
 * TITLE STANDARD: pass `title` as the DESCRIPTIVE part only — this component
 * appends the brand, producing "<descriptive part> | Wareham Music Group"
 * within 60 characters. Override the suffix with `brand` (Journal posts use
 * "WMG Journal"), or pass `fullTitle` when a page needs an exact string.
 * Never hand-write "WMG | ..." prefixes.
 *
 * DESCRIPTION STANDARD: pass a complete sentence of ~150–155 characters.
 * `clampDescription` is a safety net only; it cuts at a sentence end or whole
 * word and never appends an ellipsis.
 */
type SeoProps = {
  title?: string;
  fullTitle?: string;
  brand?: string;
  description?: string;
  canonicalPath?: string;
  canonicalUrl?: string;
  image?: string;
  type?: "website" | "article" | "music.album";
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  publishedTime?: string;
  modifiedTime?: string;
};

export const Seo = ({
  title,
  fullTitle,
  brand = BRAND_SUFFIX,
  description,
  canonicalPath,
  canonicalUrl,
  image,
  type = "website",
  noindex,
  jsonLd,
  publishedTime,
  modifiedTime,
}: SeoProps) => {
  const location = useLocation();
  const pageTitle = fullTitle || (title ? buildTitle(title, brand) : DEFAULT_TITLE);
  const pageDesc = clampDescription(description || DEFAULT_DESCRIPTION);
  const pagePath = canonicalPath ?? location.pathname;
  const canonical = canonicalUrl || absoluteUrl(pagePath);
  const ogImage = image ? absoluteUrl(image) : DEFAULT_OG_IMAGE;
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];


  return (
    <Helmet prioritizeSeoTags>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDesc} />
      <meta
        name="robots"
        content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large"}
      />
      {/* No canonical on noindex pages (e.g. 404) — a self-reference to a
          non-existent URL contradicts the noindex directive. */}
      {noindex ? null : <link rel="canonical" href={canonical} />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_GB" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDesc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDesc} />
      <meta name="twitter:image" content={ogImage} />

      {publishedTime ? <meta property="article:published_time" content={publishedTime} /> : null}
      {modifiedTime ? <meta property="article:modified_time" content={modifiedTime} /> : null}

      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json" data-seo={`page-${i}`}>
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

// Backwards-compat alias for old PageTitle imports.
export const PageTitle = Seo;
