// Shared client-side search helpers for filter/sort sections.

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with",
  "by", "from", "at", "into", "your", "my", "our", "is", "it", "this", "that",
]);

export function tokenizeSearch(str: string): string[] {
  return str
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0 && !STOP_WORDS.has(w));
}

/**
 * Returns true if every meaningful token in `query` appears as a substring
 * of some token in the haystack fields. Empty / stop-word-only query => true.
 */
export function matchesSearch(query: string, fields: Array<string | undefined | null>): boolean {
  const queryTokens = tokenizeSearch(query);
  if (queryTokens.length === 0) return true;
  const haystack = tokenizeSearch(fields.filter(Boolean).join(" "));
  return queryTokens.every((qt) => haystack.some((ht) => ht.includes(qt)));
}
