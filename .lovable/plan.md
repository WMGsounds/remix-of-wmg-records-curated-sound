# Scheduled Journal publishing (Europe/London)

Journal articles become visible only when `Published` is checked **and** the publish date has arrived in Europe/London time. Publication happens automatically at the scheduled moment — no redeploy, no re-saving in Notion.

## Publication rule

Visible when all are true:
- `Published` checkbox is true
- a publish date exists and parses validly
- that date/time is now or in the past, in Europe/London

Everything else (no date, invalid date, future date, unchecked) is hidden.

Date-only values such as `2026-08-04` are treated as `00:00 Europe/London`, computed with a timezone-aware conversion (`Intl.DateTimeFormat` with `timeZone: "Europe/London"`), not naive ISO parsing — so BST and GMT are both correct without hardcoded offsets. Values that include a time and offset are respected exactly as entered.

## Where the filter is applied

All Journal data reaches the site through three server routes, so filtering there covers every surface at once (listing, homepage, featured, search, related, categories, artist pages, sitemap, metadata):

- `api/notion/journal.ts` — listing feed
- `api/notion/journal/[slug].ts` — direct slug resolution; ineligible articles return the existing not-found response
- `api/sitemap.ts` — sitemap entries

No React component changes; no design, card, typography, excerpt, category, slug or body-rendering changes.

## Caching

Journal routes currently share `CACHE_HEADERS` with a 50-minute CDN lifetime, which would delay scheduled publication. The three Journal-related responses will use a Journal-specific header with `max-age=60, s-maxage=300, stale-while-revalidate=300`, so a scheduled article appears within about five minutes at the latest. No cron job or external service is added.

## Technical detail

- New shared helper in `api/notion/_journal.ts`: `isJournalPublished(article, now?)` plus a Europe/London date resolver, reusing the existing `date()` property reader.
- Normalisation keeps existing conventions and reads both `Publish Date` and the currently-used `Published Date` property name (whichever exists), exposing `publishDate: string | null`. Missing/invalid dates stay null — never defaulted to today. The existing `publishedDate` field on the summary type is kept as-is so no UI code changes.
- Sorting stays newest-first by publish date; hidden future articles are removed before sorting, so ordering is unaffected until they go live.

## Verification and reporting

After implementation I will run the Notion-backed routes and confirm: past date visible, today visible, future hidden, unchecked hidden, no-date hidden, future slug not resolvable, and future article absent from sitemap and homepage payloads. I will also list any currently published articles that have no publish date — these would become hidden under the new rule, so I will report them for correction in Notion rather than inventing dates. If that list is non-empty I will flag it before you publish.
