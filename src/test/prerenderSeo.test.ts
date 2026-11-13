import { describe, expect, it } from "vitest";
import { checkPageSeo } from "../../scripts/prerender-seo.mjs";
import { resolveRoutes, resolveSitemapRoutes } from "../lib/routeRegistry";
import { SITE_URL } from "../lib/seo";

const storeUrl = SITE_URL + "/store";
const store = {
  route: "/store",
  expectedCanonical: storeUrl,
  html: "<h1>Store</h1><h2>New pre-orders</h2>",
  head: `<link rel="canonical" href="${storeUrl}"><meta name="robots" content="index, follow">`,
  blocks: [{
    "@type": "ItemList",
    itemListElement: [
      { "@type": "ListItem", name: "We Praise" },
      { "@type": "ListItem", name: "Christmas With The Adulations" },
    ],
  }],
};

describe("deployment SEO checks", () => {
  it("accepts a Store list of pre-orders with no prices", () => {
    expect(checkPageSeo(store)).toEqual([]);
  });

  it.each([
    [{ "@type": "Product", name: "We Praise" }, "Product"],
    [{ "@graph": [{ "@type": ["Thing", "https://schema.org/Product"] }] }, "Product"],
    [{ "@type": "ItemList", itemListElement: [{ item: { "@type": "Offer", price: "27.90" } }] }, "Offer"],
  ])("rejects commerce markup in the Store or an editorial page", (block, type) => {
    expect(checkPageSeo({ ...store, blocks: [...store.blocks, block] }).join("\n"))
      .toContain(`${type} JSON-LD`);
    expect(checkPageSeo({ ...store, route: "/releases/new-release", blocks: [block] }).join("\n"))
      .toContain(`${type} JSON-LD`);
  });

  it("flags missing catalogue markup, conflicting canonicals and indexing blocks", () => {
    const problems = checkPageSeo({
      ...store,
      html: "<h2>Loading</h2>",
      head: store.head + `<link href="${SITE_URL}/" rel="canonical"><meta content='none' name='Googlebot'>`,
      blocks: [],
    });
    expect(problems).toEqual([
      expect.stringContaining("ItemList"),
      expect.stringContaining("main headings"),
      expect.stringContaining("canonical URL"),
      expect.stringContaining("blocks indexing"),
    ]);
  });

  it("adds new artists, releases and canonical articles to the sitemap automatically", () => {
    const content = {
      artists: [{ slug: "new-artist" }],
      releases: [{ slug: "new-release" }],
      journal: [
        { slug: "new-story" },
        { slug: "same-canonical", canonicalUrl: SITE_URL + "/journal/same-canonical" },
        { slug: "syndicated", canonicalUrl: "https://example.com/story" },
      ],
    };
    const sitemap = resolveSitemapRoutes(content).map(({ path }) => path);
    expect(sitemap).toEqual(expect.arrayContaining([
      "/artists/new-artist", "/releases/new-release", "/journal/new-story", "/journal/same-canonical",
    ]));
    expect(sitemap).not.toContain("/journal/syndicated");
    expect(resolveRoutes(content).map(({ path }) => path)).toContain("/journal/syndicated");
  });
});
