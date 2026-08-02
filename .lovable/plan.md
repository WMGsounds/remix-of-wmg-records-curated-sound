## Goal

Support the new Notion Store checkbox "Pre-order?" and show a small supporting line beneath the Availability wording on Store cards, under precise conditions only.

## Rules

- Coming Soon + Pre-order? checked → under "Coming Soon": `Pre-order your copy now!`
- Coming Soon + not checked → no extra text
- Sold Out (regardless of Pre-order?) → under "Sold Out": `Order your copy now and it will be shipped as soon as it is available.`
- Available Now / Hidden → unchanged, Pre-order? ignored

## Changes

1. `api/notion/_normalize.ts` — in `normalizeStoreItem`, read the checkbox with the existing `bool()` + `findProp()` helpers (accepting "Pre-order?", "Pre-order", "Preorder") and return `preOrder: boolean`.
2. `src/lib/types.ts` — add `preOrder: boolean` to `StoreItem`.
3. `src/lib/mockData.ts` and `api/notion/_fallback.ts` — add `preOrder: false` to sample store items (one Coming Soon sample set to `true` for visual checking).
4. `src/components/StoreCard.tsx` — extend the shared `UnavailableCallout` block (used by both featured and grid variants, so no layout duplication) to render an optional second line under the existing availability wording:
   - text resolved from availability + `preOrder`
   - styling: `mt-2 text-[11px] leading-snug text-ivory/60`, centred inside the existing bordered callout, no change to the callout's border/padding or the availability line itself
   - nothing rendered when there's no message

No changes to purchase buttons, filtering, sorting, availability gating, or any other card logic.
