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
- `api/notion/store.ts` and `api/notion/tracks.ts` — release lookups used for store items and track listings
- `api/sitemap.ts` — sitemap entries

Filtering happens before sorting, so ordering (newest release date first) is unchanged until an item becomes eligible.

## Notion property handling

`normalizeRelease` already reads `Release Date` and `Show on Website` / `Show On Website`. It will additionally accept the exact `Show on website` casing, and `releaseDate` normalisation keeps its current string type while an explicit `null`-safe check is used in the eligibility helper. No new UI fields; no defaulted or invented dates.

One judgement call to confirm: today, when the checkbox property is entirely absent from a page, the normaliser treats it as `true`. The spec says a missing value should hide the release. Since the property exists in your database, absence would only happen through a schema change — I will keep the existing `true` default so a Notion rename can't wipe the whole site, and the missing-date rule will still hide anything unscheduled. Say the word if you'd rather it default to hidden.

## Caching

Release routes currently use `CACHE_HEADERS` (50-minute CDN lifetime), too slow for scheduling. A new `RELEASE_CACHE_HEADERS` constant in `api/notion/_client.ts` with `max-age=60, s-maxage=300, stale-while-revalidate=60` is applied to the release-bearing routes, so a scheduled release appears within about five minutes. Journal keeps its own constant. No cron job or external service.

## Warnings and fallback data

- A deduplicated server-side warning lists releases marked `Show on website` that lack a valid `Release Date`: `Releases marked Show on website but missing a valid Release Date (hidden)`. I'll report those titles/slugs back to you rather than inventing dates.
- Mock/fallback releases in `api/notion/_fallback.ts` already carry past dates and stay visible; only explicit values are adjusted if a check shows otherwise.

## Out of scope

No design, card, typography, artwork, link, slug, store availability, pre-order, pricing, track list, mobile-layout or Journal changes.

## Verification

I will exercise the release routes and confirm: past date visible, today visible, future hidden, unticked hidden, no-date hidden, invalid date hidden, future slug not resolvable, absent from sitemap, homepage, artist pages, search and related content, and that existing eligible releases still display. Results and the missing-date list will be reported.
