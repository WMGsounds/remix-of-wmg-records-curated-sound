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
import { breadcrumbList, imageObject } from "@/lib/schema";
import type { SeoMeta } from "@/lib/seoConfig";


/**
 * THE ONLY PLACE HEAD TAGS ARE WRITTEN.
 *
 * Pages never hand-write meta tags, canonicals, OG/Twitter tags,
 * Organization, WebSite, BreadcrumbList or ImageObject JSON-LD. They pass a
 * metadata object from `src/lib/seoConfig.ts` (via `staticSeo()` / `seoFor.*`)
 * plus any content-type schema (MusicAlbum, BlogPosting…) in `jsonLd`.
 *
 * TITLE STANDARD: `title` is the DESCRIPTIVE part only — the brand is appended,
 * producing "<descriptive part> | Wareham Music Group" within 60 characters.
 * `brand` overrides the suffix (Journal posts use "WMG Journal"); `fullTitle`
 * sets an exact string. Never lead with "WMG | ".
 *
 * DESCRIPTION STANDARD: authored descriptions are used VERBATIM. Clamping to
 * 155 characters happens in seoConfig only where a description is derived from
 * body copy, and `descriptionFallback` (derived copy passed at render time) is
 * the one input this component clamps itself. Never auto-truncate an authored
 * string, and never append an ellipsis.
 */
type SeoProps = Partial<SeoMeta> & {
  /** Derived-from-body-copy fallback; clamped, used only when no description. */
  descriptionFallback?: string;
  /** Content-type schema only (MusicGroup, MusicAlbum, BlogPosting, …). */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** ImageObject inputs — this component builds the nodes. */
  images?: Parameters<typeof imageObject>[0][];
};

/** Fallback trail for any non-home route that didn't supply one. */
const trailFromPath = (path: string) => {
  const segs = path.split("/").filter(Boolean);
  let acc = "";
  return [
    { name: "Home", path: "/" },
    ...segs.map((s) => {
      acc += `/${s}`;
      return {
        name: s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        path: acc,
      };
    }),
  ];
};

export const Seo = ({
  title,
  fullTitle,
  titleFallback,
  brand = BRAND_SUFFIX,
  description,
  descriptionFallback,
  canonicalPath,
  canonicalUrl,
  image,
  type = "website",
  noindex,
  jsonLd,
  images,
  breadcrumb,
  publishedTime,
  modifiedTime,
}: SeoProps) => {
  const location = useLocation();
  const pageTitle =
    fullTitle || (title ? buildTitle(title, brand, titleFallback) : DEFAULT_TITLE);
  // Authored descriptions pass through untouched; only derived copy is clamped.
  const pageDesc = description?.trim()
    ? description.trim()
    : clampDescription(descriptionFallback || DEFAULT_DESCRIPTION);
  const pagePath = canonicalPath ?? location.pathname;
  const canonical = canonicalUrl || absoluteUrl(pagePath);
  const ogImage = image ? absoluteUrl(image) : DEFAULT_OG_IMAGE;

  /* BreadcrumbList is attached automatically to every route except the
     homepage (and error pages), so no page has to opt in. Organization and
     WebSite are emitted by the root layout only — never here. */
  const trail =
    noindex || pagePath === "/"
      ? []
      : breadcrumb && breadcrumb.length > 1
        ? breadcrumb
        : trailFromPath(pagePath);

  const schemas: Record<string, unknown>[] = [
    ...(trail.length > 1 ? [breadcrumbList(trail)] : []),
    ...(jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []),
    ...((images || [])
      .map((i) => imageObject(i))
      .filter(Boolean) as Record<string, unknown>[]),
  ];


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
