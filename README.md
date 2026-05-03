# WMG Records — Wareham Music Group

Editorial site for the WMG Records label.

## SEO conventions

### Default Open Graph image

The default social-sharing image is served from `/og-default.jpg` (referenced by
`src/lib/seo.ts` as `DEFAULT_OG_IMAGE`).

**Action required:** replace `public/og-default.jpg` with a 1200×630 JPEG using
WMG brand artwork (logo on warm ivory or charcoal background, label name
visible). Keep the filename `og-default.jpg` so all canonical references
continue to resolve.

### Image filename conventions

All public image assets must use lowercase hyphenated, descriptive,
SEO-friendly filenames. Examples:

- `betty-blane-vintage-soul-studio-portrait.webp`
- `bobby-chills-late-night-blues-club-portrait.webp`
- `wmg-records-default-og-image.jpg`

Avoid generic names like `image1.jpg`, `IMG_1234.png`, `hero.jpg`.

When adding a new artist, release or journal hero image, name the file using:
`{artist-or-subject}-{descriptor}-{shot-type}.{ext}`.

### Alt text

- Meaningful images: descriptive alt text including subject and context.
- Decorative images (background textures, dividers): `alt=""`.
- Artist/release/article images: include the artist/title name in the alt.

### Routes & sitemap

- `public/robots.txt` references `https://www.wmgsounds.com/sitemap.xml`.
- `api/sitemap.ts` dynamically lists all static pages, published artists,
  releases, journal articles and journal categories. Items marked `noindex`
  or unpublished in Notion are excluded.

### Diagnostics

Visit `/seo-diagnostics` (noindexed) to audit each public route's metadata,
canonical, OG/Twitter tags, JSON-LD and H1 count.

### Fonts

Cormorant Garamond + Inter are loaded non-blocking from `index.html` with
`display=swap` and preconnect hints. Do not re-add `@import url(...)` in
`src/index.css` — that pattern blocks rendering.
