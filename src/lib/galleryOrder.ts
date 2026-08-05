import type { GalleryImage } from "./types";

/** Deterministic seed that changes once per day (UTC). */
export const dailySeed = (d: Date = new Date()): number => {
  const day = Math.floor(d.getTime() / 86_400_000);
  return (day * 2654435761) >>> 0;
};

/** Small deterministic PRNG (mulberry32). Never uses Math.random(). */
const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffle = <T,>(items: T[], rand: () => number): T[] => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/** Evenly redistribute Featured images across the list, preserving order. */
const spreadFeatured = (items: GalleryImage[]): GalleryImage[] => {
  const featured = items.filter((i) => i.featured);
  const rest = items.filter((i) => !i.featured);
  if (!featured.length || !rest.length) return items;
  const step = items.length / featured.length;
  const out: GalleryImage[] = [];
  let fi = 0;
  let ri = 0;
  for (let pos = 0; pos < items.length; pos++) {
    const wantFeatured = fi < featured.length && pos >= Math.floor(fi * step);
    if (wantFeatured) out.push(featured[fi++]);
    else if (ri < rest.length) out.push(rest[ri++]);
    else out.push(featured[fi++]);
  }
  return out;
};

/**
 * Curated ordering: group by artist, shuffle groups and their contents with a
 * daily-stable seed, then round-robin interleave so the same artist rarely
 * appears twice in a row.
 */
export const curateGalleryOrder = (images: GalleryImage[], seed: number): GalleryImage[] => {
  if (images.length < 2) return images;
  const rand = rng(seed);

  const groups = new Map<string, GalleryImage[]>();
  images.forEach((img) => {
    const key = img.artistSlug || img.artistName || "unknown";
    const bucket = groups.get(key);
    if (bucket) bucket.push(img);
    else groups.set(key, [img]);
  });

  const queues = shuffle([...groups.values()], rand).map((g) => shuffle(g, rand));

  const out: GalleryImage[] = [];
  let lastKey = "";
  while (out.length < images.length) {
    // Prefer the largest remaining queue that isn't the previous artist.
    let pick = -1;
    let best = -1;
    for (let i = 0; i < queues.length; i++) {
      const q = queues[i];
      if (!q.length) continue;
      const key = q[0].artistSlug || q[0].artistName || "unknown";
      if (key === lastKey) continue;
      if (q.length > best) {
        best = q.length;
        pick = i;
      }
    }
    if (pick === -1) pick = queues.findIndex((q) => q.length);
    if (pick === -1) break;
    const img = queues[pick].shift() as GalleryImage;
    lastKey = img.artistSlug || img.artistName || "unknown";
    out.push(img);
  }

  return spreadFeatured(out);
};
