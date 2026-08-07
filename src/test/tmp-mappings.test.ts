import { describe, it, expect } from "vitest";
import { normalizeGalleryImage } from "../../api/notion/_gallery";
import { normalizeReleaseTrack } from "../../api/notion/_normalize";
const page = (props: any) => ({ id: "p1", properties: props });
describe("mappings", () => {
  it("gallery emoji props", () => {
    const g = normalizeGalleryImage(page({
      "Show on Website": { type: "checkbox", checkbox: true },
      Image: { files: [{ type: "external", external: { url: "https://x/y.jpg" } }] },
      "🔄 Artist Name": { rich_text: [{ plain_text: "Jane" }] },
      "🔄 Artist Slug": { rich_text: [{ plain_text: "jane" }] },
      "🔄 Gallery ID": { unique_id: { prefix: "IMG", number: 7 } },
      Featured: { type: "checkbox", checkbox: true },
    }))!;
    expect([g.artistName, g.artistSlug, g.galleryId, g.featured]).toEqual(["Jane","jane","IMG-7",true]);
  });
  it("legacy fallback", () => {
    const g = normalizeGalleryImage(page({
      "Show on Website": { type: "checkbox", checkbox: true },
      Image: { files: [{ type: "external", external: { url: "https://x/y.jpg" } }] },
      "Artist Name": { rich_text: [{ plain_text: "Old" }] },
      "Gallery ID": { unique_id: { number: 3 } },
    }))!;
    expect([g.artistName, g.galleryId]).toEqual(["Old","3"]);
  });
  it("release track Name", () => {
    const lookup = new Map([["t1", { properties: { "Track Title": { rich_text: [{ plain_text: "Related" }] } } }]]);
    const a = normalizeReleaseTrack(page({ Track: { relation: [{ id: "t1" }] }, Name: { title: [{ plain_text: "Live Version" }] } }), lookup as any);
    expect(a.title).toBe("Live Version");
    const b = normalizeReleaseTrack(page({ Track: { relation: [{ id: "t1" }] }, "Display Title": { rich_text: [{ plain_text: "Old Title" }] } }), lookup as any);
    expect(b.title).toBe("Old Title");
    const c = normalizeReleaseTrack(page({ Track: { relation: [{ id: "t1" }] }, Name: { title: [] } }), lookup as any);
    expect(c.title).toBe("Related");
  });
});
