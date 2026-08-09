// Pure helpers for the permanent release-artwork URL mode of /api/image-proxy.
// Kept underscore-prefixed so Vercel never deploys it as a serverless function.

// Delegates to the shared Notion property reader (./_notionText.ts) so slug
// lookups behave exactly like the rest of the app — including formula values.
export const propertyText = (p: any): string => notionText(p);


export const findProp = (props: Record<string, any>, ...names: string[]): any => {
  for (const n of names) if (props?.[n] !== undefined) return props[n];
  const norm = (s: string) => s.normalize("NFKC").replace(/\s+/g, "").toLowerCase();
  const targets = names.map(norm);
  for (const key of Object.keys(props ?? {})) {
    if (targets.includes(norm(key))) return props[key];
  }
  return undefined;
};

export const stripExtension = (raw: string) => raw.replace(/\.(jpg|jpeg|png|webp)$/i, "");

// Decode + strip extension + normalise case for composite-key comparison.
export const normalizeCompositeKey = (raw: string): string => {
  let value = raw ?? "";
  try {
    value = decodeURIComponent(value);
  } catch {
    /* keep raw when it isn't valid percent-encoding */
  }
  return stripExtension(value).trim().toLowerCase();
};

export const artistSlugMap = (artistPages: any[]): Map<string, string> => {
  const map = new Map<string, string>();
  for (const page of artistPages ?? []) {
    const slug = propertyText(findProp(page?.properties ?? {}, "Slug"));
    if (slug) map.set(page.id, slug);
  }
  return map;
};

export type CompositeMatch =
  | { page: any; reason: "match" }
  | { page: null; reason: "not_found" | "missing_release_slug" | "missing_artist_slug" };

// Both slugs may contain hyphens, so full keys are compared — never split.
export const matchReleaseByCompositeKey = (
  releasePages: any[],
  artistSlugs: Map<string, string>,
  compositeKey: string,
): CompositeMatch => {
  const target = normalizeCompositeKey(compositeKey);
  let sawReleaseSlugMissing = false;
  let sawArtistSlugMissing = false;

  for (const page of releasePages ?? []) {
    const props = page?.properties ?? {};
    const releaseSlug = propertyText(findProp(props, "Slug"));
    if (!releaseSlug) {
      sawReleaseSlugMissing = true;
      continue;
    }
    const artistId = findProp(props, "Artist")?.relation?.[0]?.id ?? "";
    const artistSlug = artistSlugs.get(artistId) ?? "";
    if (!artistSlug) {
      if (target.endsWith(`-${releaseSlug.toLowerCase()}`) || target === releaseSlug.toLowerCase()) {
        sawArtistSlugMissing = true;
      }
      continue;
    }
    if (`${artistSlug}-${releaseSlug}`.toLowerCase() === target) return { page, reason: "match" };
  }

  if (sawArtistSlugMissing) return { page: null, reason: "missing_artist_slug" };
  if (sawReleaseSlugMissing && (releasePages ?? []).length === 1) {
    return { page: null, reason: "missing_release_slug" };
  }
  return { page: null, reason: "not_found" };
};

export const firstFileUrl = (prop: any): string => {
  const files = prop?.files ?? [];
  for (const f of files) {
    const u = f?.type === "external" ? f.external?.url : f?.file?.url;
    if (typeof u === "string" && u.trim()) return u.trim();
  }
  return "";
};

export const sanitizeFilename = (value: string) =>
  value.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "artwork";
