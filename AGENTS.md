# WMG website

Follow the parent WMG and global storage/recovery rules. Active source,
dependencies, builds and previews stay in `C:/Users/tomwa/Projects/WMG`.
Selected important outputs use the existing private OneDrive WMG root:
`C:/Users/tomwa/OneDrive/Documents/Work/Businesses/WMG (Wareham Music Group)`.
Website regional-store evidence is under `Project Setup/Website/Store Regions/2026-11-01`.

## Store regions — authorised 1 November 2026

- Public categories: United Kingdom, European Union, United States, International.
  Never label US visitors International. EU means all 27 member states.
- GBP, EUR and USD are actual regional retail prices maintained in the WMG Sounds
  Notion Store database, sourced from elasticStage. Preserve existing GBP fields;
  EUR/USD fields use `Price - <format> - EUR/USD`. Never replace fixed prices with
  exchange-rate estimates or invent missing regional retailer prices.
- International local-currency values are explicitly labelled estimates based on
  USD prices. Keep rate provenance/date and a clear USD fallback when unavailable.
  Approximate values must not be emitted as retailer Offer structured data.
- Visitor choices override location detection and persist in their browser. Keep
  country responses uncached and independent of shared catalogue/FX caches.
- elasticStage uses one release URL and its own shipping-country selection.
  Do not invent currency parameters or promise the WMG choice sets its checkout.
- Apply pricing consistently in the Store and the store cards on artist pages.
- Check the `notion_wmg` workspace identity before writes; preserve unrelated
  properties, record identities, visibility, approvals and original price values.

See README.md for field conventions and checks. Use the existing current Bun
lockfile for dependencies. After source/instruction changes run the parent
`Tools/backup-source.py` with the bundled Python interpreter. Follow
`ROLLING-BACKUPS.md`: latest plus previous per registered source set, fresh exact
remote proof before rotation, legacy/protected archives retained. Local OneDrive
copy verification alone does not prove remote upload. `dist` and `dist-ssr` are
reproducible build output and excluded from source archives.
