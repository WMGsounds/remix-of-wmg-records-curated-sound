# See all releases by [Artist]

## What exists today

- Each release detail page ends with a "Related Releases" section (max 3 releases by the same artist).
- The main Releases page has three controls: a **Type** filter (All / Single / Album / EP), a **Search** box, and a **Sort by** select. There is currently **no artist filter** — filtering by artist is new work.
- Release records already carry a stable `artistSlug` and `artistName`, so the link and the filter can share the same identifier.

## What will change

### 1. Releases page: new Artist filter, URL-driven

- Add an **Artist** select next to the existing Type filter, built automatically from the artists present in the loaded releases (label = artist name, value = artist slug), sorted alphabetically, with an "All Artists" default. No hard-coded names.
- Sync the selection to the URL as `/releases?artist=the-adulations` using React Router's `useSearchParams`, so:
  - the filter is read on load and after refresh,
  - back/forward navigation works,
  - the URL is shareable and reflects the selected artist,
  - choosing "All Artists" removes the parameter,
  - an unknown or missing slug falls back to the unfiltered page.
- Artist filtering combines with the existing Type filter, search and sort; none of those change.

### 2. Release page: button beside the Related Releases heading

- Put the existing "Related Releases" heading and a new link button in a flex row: heading left, button right, vertically aligned on desktop; stacked with the button below the heading (full-width) on mobile.
- Button label: `See all releases by {artist name}` (dynamic, wraps gracefully on long names).
- Links to `/releases?artist={artist slug}` using the site's existing outline/uppercase button treatment, hover and focus-visible styles. Renders only when the artist slug is known.

## Not changing

- Related Releases selection logic, card design, and the 3-item cap.
- Release visibility, publication-date or "Show on website" rules.
- Existing Type filter, search, sort behaviour and layout grouping.

## Technical notes

- Files touched: `src/pages/Releases.tsx` (artist options + `useSearchParams` state), `src/pages/ReleasePage.tsx` (heading row + button).
- Artist option list derived with `useMemo` from `releases` (`artistSlug` → `artistName`), so it stays correct as the catalogue grows.
- Reuses `FilterField` + shadcn `Select` from `src/components/FilterBar.tsx` for the new control.
