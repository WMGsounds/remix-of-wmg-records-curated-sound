import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import {
  SITE_NAME,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  absoluteUrl,
  truncate,
} from "@/lib/seo";

type SeoProps = {
  title?: string;
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
  const pageTitle = title ? `${SITE_NAME} | ${title}` : DEFAULT_TITLE;
  const pageDesc = truncate(description || DEFAULT_DESCRIPTION);
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
      <link rel="canonical" href={canonical} />

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
