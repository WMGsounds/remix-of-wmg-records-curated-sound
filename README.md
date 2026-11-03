# WMG Records — Wareham Music Group

Editorial site for the WMG Records label.

## Regional store pricing — 3 November 2026

The store has four public regions: United Kingdom (GBP), European Union (EUR),
United States (USD), and International. EU means the 27 member states, including
those outside the euro area. The host's country header selects the default;
unknown countries fall back to International/USD. Explicit visitor choices win
over automatic detection and are saved in `wmg-store-region-v1` local storage.
“Use my location” clears that preference. Browser language is not treated as country.

Fixed prices come from the existing WMG Sounds Notion Store database. Existing
`Price - Vinyl`, `Price - CD`, etc. remain GBP. The new rich-text properties are
`Price - Vinyl - USD`, `Price - Vinyl - EUR`, `Price - CD - USD`, and
`Price - CD - EUR`, with explicit symbols (`US$31.90`, `€32.90`). The normalizer
also supports this suffix convention for other existing formats, if verified
regional price fields are added later. Missing regional values show “See purchase
page”; UK iTunes values are not relabelled or converted into US/EU retailer prices.

All eight current releases' physical prices were checked on elasticStage in GBP,
USD and EUR on 1 November 2026, using United Kingdom, United States and Germany
shipping settings (Reggae also cross-checked in France). 28 new values were saved
to Notion. Original fields, identities, visibility, pre-orders and links remain.
elasticStage uses the same release URL in each region and selects prices by its
own shipping-country setting. No unverified currency URL parameters are appended;
visitors are reminded to check their shipping country on the purchase page.

International visitors use the published Notion USD bucket. Each visible price
list includes: "Regional prices may vary. See the checkout page for exact prices."
There are no exchange-rate conversions, currency selectors or provider requests.
International reference prices are excluded from structured Offer markup because
checkout prices can differ by country. UK/US/EU offers use their published buckets.
Saved International currency choices from the earlier preview resolve to USD.
This supersedes the 1 November estimate design following the owner's 3 November
instruction and their report that ElasticStage cannot supply a direct price feed.
Country responses are private, uncached and separate from the shared catalogue.
`/api/notion/store?context=region` uses the existing store function; the retired
`?context=rates` route returns 410 without contacting a provider or the CMS.

Development root: `C:\Users\tomwa\Projects\WMG\wmg-sounds-site`.
Selected evidence/output root: the established private OneDrive WMG folder,
`Project Setup/Website/Store Regions/2026-11-03`. Run WMG's standard
`Tools/backup-source.py` after source changes; see the parent README and
ROLLING-BACKUPS.md for verification and latest-plus-previous retention.
Dependencies, builds and previews stay local. The current Bun lockfile is used
for installation (`bun install --frozen-lockfile`); the historical npm lockfile
is out of date. Validation: `npm test`, `npm run typecheck`, `npm run build`.

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
