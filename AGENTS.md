# WMG website

Follow the parent WMG and global storage/recovery rules. Active source,
dependencies, builds and previews stay in `C:/Users/tomwa/Projects/WMG`.
Selected important outputs use the existing private OneDrive WMG root:
`C:/Users/tomwa/OneDrive/Documents/Work/Businesses/WMG (Wareham Music Group)`.
Website regional-store evidence is under `Project Setup/Website/Store Regions/2026-11-03`.

## Store regions — authorised 3 November 2026

- Public categories: United Kingdom, European Union, United States, International.
  Never label US visitors International. EU means all 27 member states.
- GBP, EUR and USD are actual regional retail prices maintained in the WMG Sounds
  Notion Store database, sourced from elasticStage. Preserve existing GBP fields;
  EUR/USD fields use `Price - <format> - EUR/USD`. Never replace fixed prices with
  exchange-rate estimates or invent missing regional retailer prices.
- International uses the published USD bucket. Show "Regional prices may vary.
  See the checkout page for exact prices." directly beneath each visible price
  list. No exchange-rate estimates, currency chooser or live ElasticStage feed.
  Omit International reference prices from retailer Offer structured data.
  This supersedes the earlier local-currency estimate design.
- Visitor choices override location detection and persist in their browser. Keep
  country responses uncached and independent of shared catalogue caches.
- elasticStage uses one release URL and its own shipping-country selection.
  Do not invent currency parameters or promise the WMG choice sets its checkout.
- Apply pricing consistently in the Store and the store cards on artist pages.
- iTunes is separate: use exact linked-release Apple IDs and actual country prices,
  with one shared persisted country selector for all formats. Pin UK and US in
  their own section above the full searchable delivery-country list; default automatically
  from the host country header. Apple cache lifetime is at most
  24 hours, refreshed on demand by ordinary website code, never by AI. Fail closed
  on expired/missing/mismatched quotes. Never fall back to stale Notion iTunes values,
  silently change storefronts, compare mixed currencies in price summaries or mark
  Apple prices as elasticStage Offers. Preserve physical GBP/EUR/USD buckets.
- Check the `notion_wmg` workspace identity before writes; preserve unrelated
  properties, record identities, visibility, approvals and original price values.

See README.md for field conventions and checks. Use the existing current Bun
lockfile for dependencies. After source/instruction changes run the parent
`Tools/backup-source.py` with the bundled Python interpreter. Follow
`ROLLING-BACKUPS.md`: latest plus previous per registered source set, fresh exact
remote proof before rotation, legacy/protected archives retained. Local OneDrive
copy verification alone does not prove remote upload. `dist` and `dist-ssr` are
reproducible build output and excluded from source archives.

Delivery-country choices must match elasticStage delivery destinations, verified
3 November 2026 against its live shipping-country selector (92 destinations).
Russia appears in the help article but not the live list, so is excluded. The source and
ISO allowlist are in `src/lib/shippingCountries.ts`. Automatic detection keeps the
actual country (including unsupported destinations for digital pricing); show a
physical delivery notice for destinations absent from the list. Do not imply
shipping to every country. Recheck the delivery source when updating the list.
