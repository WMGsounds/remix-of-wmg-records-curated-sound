import { expect, it } from "vitest";
import { SHIPPING_COUNTRIES, SHIPPING_COUNTRY_OPTIONS } from "../lib/shippingCountries";
import { EU_COUNTRIES } from "../lib/storeRegion";
import { storeCountry } from "../lib/itunes";

it("covers the live 92-destination delivery list including every EU member and the pinned countries", () => {
  expect(SHIPPING_COUNTRY_OPTIONS).toHaveLength(92);
  for (const code of [...EU_COUNTRIES, "GB", "US"]) expect(SHIPPING_COUNTRIES.has(code)).toBe(true);
  for (const { code } of SHIPPING_COUNTRY_OPTIONS) expect(storeCountry(code)).toBe(code);
});
it("excludes unavailable delivery destinations without losing their digital country identity", () => {
  for (const code of ["RU", "AF", "AQ"]) {
    expect(SHIPPING_COUNTRIES.has(code)).toBe(false);
    expect(storeCountry(code)).toBe(code);
  }
});
