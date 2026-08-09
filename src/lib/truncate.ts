// SINGLE TRUNCATION IMPLEMENTATION FOR THE WHOLE PROJECT (client + api).
//
// TEMPORARY FALLBACK — NOT A CONTENT STRATEGY.
// Standing SEO rule 5: titles and descriptions are authored to length in
// Notion / seoConfig.ts and used verbatim. This helper exists only so that a
// missing or over-long authored string still produces a clean tag instead of
// an empty or mid-word one. If it ever fires on a page you care about, fix the
// source string — do not tune this function.
//
// It cuts at the last whole word within `max` characters, strips trailing
// punctuation, and NEVER appends an ellipsis. There must be no second copy of
// this logic anywhere in the repo.

const normalise = (s?: string | null): string =>
  (s || "").replace(/\s+/g, " ").replace(/[\s.…]*…\s*$/, "").trim();

export const truncateAtWord = (s?: string | null, max = 155): string => {
  const t = normalise(s);
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:–—-]+$/, "");
};
