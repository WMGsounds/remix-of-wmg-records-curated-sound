const commerceType = /^(?:(?:https?:\/\/schema\.org\/)|schema:)?(?:Product|ProductGroup|Offer|AggregateOffer)$/;

function findCommerceType(value) {
  if (!value || typeof value !== "object") return undefined;
  const types = [value["@type"]].flat();
  const type = types.find((type) => typeof type === "string" && commerceType.test(type));
  if (type) return type;
  for (const child of Object.values(value)) {
    const nested = findCommerceType(child);
    if (nested) return nested;
  }
}

function attribute(tag, name) {
  return new RegExp("\\s" + name + "\\s*=\\s*([\"'])(.*?)\\1", "i").exec(tag)?.[2];
}

export function checkPageSeo({ html, head, blocks, route, expectedCanonical }) {
  const problems = [];
  const type = findCommerceType(blocks);
  if (type) problems.push(`emitted ${type} JSON-LD. WMG currently publishes a Store catalogue and editorial pages. Use ItemList for catalogue entries.`);

  if (route === "/store" && blocks.flat().filter((node) => node?.["@type"] === "ItemList").length !== 1) {
    problems.push("must emit exactly one ItemList for the Store catalogue");
  }

  const headings = [...html.matchAll(/<h1(?=[\s>])/gi)].length;
  if (headings !== 1) problems.push(`has ${headings} main headings (expected one h1)`);

  if (expectedCanonical) {
    const canonicals = [...head.matchAll(/<link\b[^>]*>/gi)]
      .filter(([tag]) => attribute(tag, "rel")?.toLowerCase() === "canonical");
    if (canonicals.length !== 1 || attribute(canonicals[0][0], "href") !== expectedCanonical) {
      problems.push(`must declare exactly one canonical URL matching the sitemap URL ${expectedCanonical}`);
    }
    const robots = [...head.matchAll(/<meta\b[^>]*>/gi)]
      .filter(([tag]) => /^(robots|googlebot|googlebot-news)$/i.test(attribute(tag, "name") ?? ""))
      .map(([tag]) => attribute(tag, "content") ?? "");
    if (robots.some((content) => /(?:^|[\s,:])(?:noindex|none)(?:$|[\s,])/i.test(content))) {
      problems.push("blocks indexing even though it is listed in the sitemap");
    }
  }

  return problems;
}
