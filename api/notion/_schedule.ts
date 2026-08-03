// Shared scheduled-publishing helpers (Europe/London, DST aware).

const LONDON = "Europe/London";
const londonParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: LONDON,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/** Offset (in ms) of Europe/London from UTC at the given instant. */
export function londonOffsetMs(instant: Date): number {
  const p: Record<string, string> = {};
  for (const part of londonParts.formatToParts(instant)) p[part.type] = part.value;
  const asUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour) === 24 ? 0 : Number(p.hour),
    Number(p.minute),
    Number(p.second),
  );
  return asUtc - instant.getTime();
}

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Resolve a Notion date value to an absolute instant (ms since epoch).
 * Date-only values are anchored to 00:00 Europe/London (DST aware).
 * Values with a time/offset are respected exactly. Returns null when invalid.
 */
export function resolvePublishInstant(value: string | null | undefined): number | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;

  if (DATE_ONLY_RE.test(raw)) {
    const naive = Date.parse(`${raw}T00:00:00Z`);
    if (Number.isNaN(naive)) return null;
    // Two passes converge on the correct offset across DST boundaries.
    let guess = naive - londonOffsetMs(new Date(naive));
    guess = naive - londonOffsetMs(new Date(guess));
    return guess;
  }

  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return null;
  if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw)) {
    // Notion date+time without an explicit offset: treat as London wall time.
    let guess = parsed - londonOffsetMs(new Date(parsed));
    guess = parsed - londonOffsetMs(new Date(guess));
    return guess;
  }
  return parsed;
}
