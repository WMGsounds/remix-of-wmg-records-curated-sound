# Scheduled Release publishing (Europe/London)

Releases go live automatically when their Notion `Release Date` arrives, but only if `Show on website` is ticked. No redeploy, no re-saving in Notion.

## Publication rule

Visible only when all are true:
- `Show on website` is true
- a `Release Date` exists and parses validly
- that date/time is now or in the past in Europe/London

Everything else (no date, invalid date, future date, unticked) is hidden.

Date-only values such as `2026-08-14` mean `00:00 Europe/London`. Values with a time but no offset are treated as London wall-clock time; values with an explicit offset are respected exactly.

## Shared timezone logic

The Journal already has a DST-aware resolver in `api/notion/_journal.ts` (`resolvePublishInstant`). That resolver plus its London-offset helper move into a new shared module `api/notion/_schedule.ts`; `_journal.ts` re-uses it (its `isJournalPublished` behaviour is unchanged) and a new `isReleasePublished(release, now?)` lives alongside the release normaliser. One timezone implementation, two eligibility helpers.

## Where the filter is applied

Server side only, in every route that reads the Releases database:

- `api/notion/releases.ts` — main listing (feeds Releases page and search)
- `api/notion/homepage.ts` — featured + latest releases
- `api/notion/artist/[slug].ts` — artist discography
- `api/notion/release/[slug].ts` — detail route; ineligible slug returns the existing 404, and its `related` list and `parentAlbum` link are filtered too
- `api/notion/journal.ts` and `api/notion/journal/[slug].ts` — release chips attached to articles
- `api/notion/tracks.ts` — release lookups used for track listings
- `api/sitemap.ts` — sitemap entries

Filtering happens before sorting, so ordering (newest release date first) is unchanged until an item becomes eligible.

## Store exception

`api/notion/store.ts` keeps its own rules. Store item visibility continues to depend solely on the item's own `Published`, `Availability` and `Pre-order?` values — Coming Soon and pre-order items for future releases stay on the Store exactly as they are today. Release records are still used internally as metadata (artist, title, artwork) to render those items. The only change: when the linked release is not yet eligible, the store item exposes no working public release-page link, so nothing links to a URL that would 404.

## Notion property handling

`normalizeRelease` reads `Release Date` and the `Show on website` checkbox, accepting `Show on website`, `Show on Website` and `Show On Website`. Visibility now fails closed: if none of those names is present, or the property is not a recognisable checkbox, `showOnWebsite` is `false` and a deduplicated server-side warning names the affected release, so a Notion rename or schema issue hides content rather than publishing it. No defaulted or invented dates; no new UI fields.

## Caching

Release routes currently use `CACHE_HEADERS` (50-minute CDN lifetime), too slow for scheduling. A new `RELEASE_CACHE_HEADERS` constant in `api/notion/_client.ts` with `max-age=60, s-maxage=300, stale-while-revalidate=60` is applied to the release-bearing routes, so a scheduled release appears within about five minutes.

Journal routes carry release chips, so their current `stale-while-revalidate=300` is tightened to 60 seconds (`max-age=60, s-maxage=300, stale-while-revalidate=60`), matching the release policy. Journal publishing behaviour itself is unchanged. No cron job or external service.

## Warnings and fallback data

- A deduplicated server-side warning lists releases marked `Show on website` that lack a valid `Release Date`: `Releases marked Show on website but missing a valid Release Date (hidden)`. I'll report those titles/slugs back to you rather than inventing dates.
- Mock/fallback releases in `api/notion/_fallback.ts` already carry past dates and stay visible; only explicit values are adjusted if a check shows otherwise.

## Out of scope

No design, card, typography, artwork, link, slug, store availability, pre-order, pricing, track list, mobile-layout or Journal changes.

## Verification

I will exercise the release routes and confirm: past date visible, today visible, future hidden, unticked hidden, no-date hidden, invalid date hidden, future slug not resolvable, absent from sitemap, homepage, artist pages, search and related content, and that existing eligible releases still display. Results and the missing-date list will be reported.
