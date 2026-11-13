# WMG Records — Wareham Music Group

Editorial site for the WMG Records label.

## TikTok account callback — 9 November 2026

`/tiktok/callback/` is a standalone return page for the TikTok Business Accounts
API. Register the exact HTTPS address `https://www.wmgsounds.com/tiktok/callback/`,
including the trailing slash, as the **TikTok account holder redirect URL**.
It is separate from the advertiser redirect URL. The page has no analytics,
third-party scripts, app secret, token exchange or token storage. It clears the
incoming query and offers a fixed loopback link carrying the short-lived code in
a fragment to the owner's local connection session. State validation, one-time
exchange, account verification and encrypted credentials belong to that local
application. An ordinary visit without an authorization response is inert.

Security headers and the explicit trailing-slash rewrite are in `vercel.json`.
Keep the page outside the React application shell and sitemap. Run
`node --test scripts/test-tiktok-callback.mjs` and the standard site build after
changes. A public callback page alone does not enable publication or establish
that TikTok has approved the app.

## Regional store pricing — 3 November 2026

The store has four public regions: United Kingdom (GBP), European Union (EUR),
United States (USD), and International. EU means the 27 member states, including
those outside the euro area. The host's country header selects the default;
unknown countries fall back to International/USD. Explicit visitor choices win
over automatic detection and are saved in `wmg-store-country-v1` local storage.
“Use my location automatically” clears that preference. One compact Change region
control opens the searchable full delivery-country list, with UK and US in a pinned section. Browser language is not treated as country.

Fixed prices come from the existing WMG Sounds Notion Store database. Existing
`Price - Vinyl`, `Price - CD`, etc. remain GBP. The new rich-text properties are
`Price - Vinyl - USD`, `Price - Vinyl - EUR`, `Price - CD - USD`, and
`Price - CD - EUR`, with explicit symbols (`US$31.90`, `€32.90`). The normalizer
also supports this suffix convention for other existing formats, if verified
regional price fields are added later. Missing physical regional values show
“See purchase page”. iTunes values are now supplied separately by Apple below.

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
Legacy exact Apple country choices migrate to the shared preference, then legacy
UK/US regions if no exact country exists. Aggregate EU/International choices return
to automatic detection because they cannot identify a country.
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

## iTunes country prices — 3 November 2026

Apple prices use the same selected or automatically detected country as the
physical store. The single country preference controls both: for example Poland
uses the EUR physical bucket and Polish iTunes prices, while Canada uses the
International USD physical bucket and Canadian iTunes prices.
Unknown location requires a choice rather than silently using another storefront.
Country choices do not promise iTunes availability in every territory.

`/api/notion/store?context=itunes&country=PL` reads the current public catalogue,
extracts exact album/song IDs from the linked release's existing Apple Music URL,
and batches them into Apple's public Lookup API. The normalizer exposes this as
`appleMusicUrl`; no Notion price fields or approval records are overwritten.
Album links use collectionPrice; song links use trackPrice. Wrong IDs, storefront
URLs, negative/unavailable prices and invalid responses are rejected. Apple
purchase links use the same country as the quote and request `app=itunes`.

Refresh is automatic on demand after a maximum 24-hour cache lifetime, not an AI
task or a fixed-time sweep of every country. Vercel caches each explicit country
URL for the remaining lifetime; country detection itself remains private/no-store.
The bounded warm-instance cache coalesces concurrent requests, spaces upstream
calls by 3.5 seconds and never supplies an expired quote after an error. This is
not a global rate-limit guarantee across server instances; Apple throttling fails
closed. The browser rechecks the cached endpoint every five minutes while active
and at quote expiry. No new cron, credentials, paid storage or PC service is needed.

Old Notion iTunes prices are suppressed even in the UK. On an unavailable or expired
quote, show “See price on iTunes” with the selected-country link where possible;
never invent a price or reuse another country's quote. Apple currency labels are
explicit (e.g. PLN 29.99). Physical price summaries exclude iTunes so mixed
currencies are not compared. Apple prices are excluded from elasticStage Offer
schema. International physical disclaimer sits above the separate iTunes row.

Validation includes live WMG country lookups, cache expiry/concurrency/failure
tests, exact song-vs-album prices, country override persistence, shared country selection and correct physical currency
buckets, full build and browser/mobile checks. Selected evidence uses private
OneDrive `Project Setup/Website/iTunes Prices/2026-11-03`.

Reference: https://performance-partners.apple.com/search-api

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
- `scripts/prerender.mjs` generates the sitemap and static HTML from the same
  route registry and published Notion content. The sitemap lists indexable
  canonical pages. A published journal article with an alternate canonical
  still gets its own HTML page and is omitted from the sitemap.
- `/store` uses `ItemList` structured data for its catalogue. Google product
  rich results are intended for pages focused on a single product, with a
  distinct URL for each offered currency.
- Every deployment, including the daily Notion rebuild, checks the rendered
  pages for a title, description and one main heading. Sitemap pages must
  allow indexing and declare their own canonical URL. The build requires a
  Store `ItemList` and rejects Product and Offer markup across the current
  catalogue and editorial pages. A catalogue fetch error stops the build
  before it can drop pages from the sitemap.

### Diagnostics

Visit `/seo-diagnostics` (noindexed) to audit each public route's metadata,
canonical, OG/Twitter tags, JSON-LD and H1 count.

### Fonts

Cormorant Garamond + Inter are loaded non-blocking from `index.html` with
`display=swap` and preconnect hints. Do not re-add `@import url(...)` in
`src/index.css` — that pattern blocks rendering.

Delivery-country choices must match elasticStage delivery destinations, verified
3 November 2026 against its live shipping-country selector (92 destinations).
Russia appears in the help article but not the live list, so is excluded. The source and
ISO allowlist are in `src/lib/shippingCountries.ts`. Automatic detection keeps the
actual country (including unsupported destinations for digital pricing); show a
physical delivery notice for destinations absent from the list. Do not imply
shipping to every country. Recheck the delivery source when updating the list.

## Catalogue recovery — 3 November 2026

Transient Notion database-resolution failures are evicted from the promise cache
so a 429/timeout can recover on the next request. The store shares a five-minute
successful catalogue cache across physical and iTunes country requests, coalesces
concurrent loads, and reads its five databases sequentially. Failed refreshes do
not reuse expired data. Store API failures return an uncached 503, never sample
products. Apple quote lifetime remains at most 24 hours. Regression tests cover
rate-limit recovery, coalescing, expiry and retry after failures.
