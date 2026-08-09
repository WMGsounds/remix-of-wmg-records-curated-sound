// SHARED NOTION PROPERTY READER — the single place Notion property objects are
// turned into plain strings.
//
// WHY THIS EXISTS:
//  * Notion FORMULA properties are NOT returned as rich text. Their value lives
//    at `property.formula.string` (or `.number` / `.boolean` / `.date.start`).
//    A naive `rich_text`-only reader silently returns "" for them — which is how
//    formula-driven SEO Title / SEO Description fields go missing.
//  * Rollups behave the same way (`rollup.string|number|date|array`).
//
// RULES FOR FUTURE NOTION-BACKED PAGE TYPES:
//  * Use `notionText(prop)` — do NOT write another local `text()` helper.
//  * It never throws: unknown shapes, nulls and blanks all return "".
//  * Relations are deliberately NOT resolved here — keep using the existing
//    per-normaliser relation lookups (`relationIds` + id → record maps).

/** Join a Notion rich-text/title array into trimmed plain text. */
const plain = (items: unknown): string =>
  Array.isArray(items)
    ? items.map((t: any) => t?.plain_text ?? "").join("").trim()
    : "";

/**
 * Read any Notion property as a plain string.
 * Supports: title, rich_text, formula (string/number/boolean/date),
 * rollup (string/number/date/array — recursive), select, status,
 * multi_select, url, email, phone_number, number, unique_id, date
 * and bare strings passed by internal helpers.
 * Returns "" for missing, null, empty or unsupported values.
 */
export function notionText(p: any): string {
  if (p === null || p === undefined) return "";
  if (typeof p === "string") return p.trim();
  if (typeof p === "number") return String(p);

  // Title / rich text
  if (Array.isArray(p.title)) return plain(p.title);
  if (Array.isArray(p.rich_text)) return plain(p.rich_text);

  // Formula — the important case. Formulas are never rich text.
  const f = p.formula;
  if (f && typeof f === "object") {
    if (typeof f.string === "string") return f.string.trim();
    if (typeof f.number === "number") return String(f.number);
    if (typeof f.boolean === "boolean") return f.boolean ? "true" : "false";
    if (f.date && typeof f.date.start === "string") return f.date.start.trim();
    return "";
  }

  // Rollup — mirrors formula behaviour, plus arrays of properties.
  const r = p.rollup;
  if (r && typeof r === "object") {
    if (typeof r.string === "string") return r.string.trim();
    if (typeof r.number === "number") return String(r.number);
    if (r.date && typeof r.date.start === "string") return r.date.start.trim();
    if (Array.isArray(r.array)) {
      for (const entry of r.array) {
        const value = notionText(entry);
        if (value) return value;
      }
    }
    return "";
  }

  // Simple scalar property types
  if (p.select?.name) return String(p.select.name).trim();
  if (p.status?.name) return String(p.status.name).trim();
  if (Array.isArray(p.multi_select)) {
    return p.multi_select.map((o: any) => o?.name).filter(Boolean).join(", ");
  }
  if (typeof p.url === "string") return p.url.trim();
  if (typeof p.email === "string") return p.email.trim();
  if (typeof p.phone_number === "string") return p.phone_number.trim();
  if (typeof p.number === "number") return String(p.number);
  if (p.unique_id) {
    const u = p.unique_id;
    return u.prefix ? `${u.prefix}-${u.number}` : String(u.number ?? "");
  }
  if (p.date && typeof p.date.start === "string") return p.date.start.trim();
  // Checkboxes are deliberately NOT stringified — use a boolean reader instead,
  // so `text(prop) || fallback` never resolves to the string "false".

  return "";
}

/** Look up a Notion property by name, tolerant to unicode variants/whitespace. */
export function findNotionProp(props: Record<string, any>, ...names: string[]): any {
  for (const n of names) if (props?.[n] !== undefined) return props[n];
  const norm = (s: string) => s.normalize("NFKC").replace(/\s+/g, "").toLowerCase();
  const targets = names.map(norm);
  for (const key of Object.keys(props ?? {})) {
    if (targets.includes(norm(key))) return props[key];
  }
  return undefined;
}
