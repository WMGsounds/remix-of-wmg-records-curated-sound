import { COUNTRY_OPTIONS } from "./itunes";

// Reconciled with elasticStage's live shipping-country selector on 2026-11-03.
// https://intercom-help.eu/elasticstage/en/articles/632196-which-countries-does-elasticstage-ship-to
// Live selector: https://elasticstage.com/faith-supreme/releases/kept-by-grace-album
// 92 destinations; Russia is in the help article but absent from the live selector.
// Keep ISO validation for automatic detection/iTunes separate from delivery eligibility.
export const SHIPPING_COUNTRIES = new Set((
  "AL DZ AD AR AU AT BS BD BE BA BO BR BG CA CL CN CO CR HR CY CZ DK DO EC EG SV EE ET FI FR DE GI GR GT GG HK HU IS IN ID IE IM IL IT JM JP JE KZ KE LV LI LT LU MY MT MX MC ME MA NL NZ NI NG MK NO PK PA PE PH PL PT PR RO SA RS SG SK SI ZA KR ES SE CH TW TH TR AE GB US UY VN ZW"
).split(" "));
export const SHIPPING_COUNTRY_OPTIONS = COUNTRY_OPTIONS.filter(country => SHIPPING_COUNTRIES.has(country.code));
