import { describe, it, expect } from "vitest";
import { notionText, findNotionProp } from "../../api/notion/_notionText.js";
import { normalizeArtist, normalizeRelease } from "../../api/notion/_normalize.js";
import { normalizeJournal } from "../../api/notion/_journal.js";
import { seoFor } from "@/lib/seoConfig";
import { buildTitle, BRAND_SUFFIX } from "@/lib/seo";

describe("notionText", () => {
  it("reads formula strings", () => {
    expect(
      notionText({ type: "formula", formula: { type: "string", string: "Example SEO title" } }),
    ).toBe("Example SEO title");
  });

  it("returns '' for blank and null formula results", () => {
    expect(notionText({ type: "formula", formula: { type: "string", string: "   " } })).toBe("");
    expect(notionText({ type: "formula", formula: { type: "string", string: null } })).toBe("");
    expect(notionText({ type: "formula", formula: null })).toBe("");
  });

  it("reads title and rich text", () => {
    expect(notionText({ type: "title", title: [{ plain_text: "Betty " }, { plain_text: "Blane" }] })).toBe("Betty Blane");
    expect(notionText({ type: "rich_text", rich_text: [{ plain_text: " Short copy " }] })).toBe("Short copy");
  });

  it("reads formula numbers, booleans and dates", () => {
    expect(notionText({ formula: { type: "number", number: 12 } })).toBe("12");
    expect(notionText({ formula: { type: "boolean", boolean: true } })).toBe("true");
    expect(notionText({ formula: { type: "date", date: { start: "2026-01-02" } } })).toBe("2026-01-02");
  });

  it("reads select, status and multi-select", () => {
    expect(notionText({ select: { name: "Soul" } })).toBe("Soul");
    expect(notionText({ status: { name: "Live" } })).toBe("Live");
    expect(notionText({ multi_select: [{ name: "Soul" }, { name: "R&B" }] })).toBe("Soul, R&B");
  });

  it("reads rollups, including arrays", () => {
    expect(notionText({ rollup: { type: "string", string: " rolled " } })).toBe("rolled");
    expect(notionText({ rollup: { type: "number", number: 3 } })).toBe("3");
    expect(notionText({ rollup: { type: "date", date: { start: "2026-02-03" } } })).toBe("2026-02-03");
    expect(
      notionText({ rollup: { type: "array", array: [{ type: "rich_text", rich_text: [] }, { type: "title", title: [{ plain_text: "Deep" }] }] } }),
    ).toBe("Deep");
  });

  it("reads scalar types and strings, and never throws", () => {
    expect(notionText({ url: " https://x.com " })).toBe("https://x.com");
    expect(notionText({ email: "a@b.com" })).toBe("a@b.com");
    expect(notionText({ phone_number: "0123" })).toBe("0123");
    expect(notionText({ number: 7 })).toBe("7");
    expect(notionText({ unique_id: { prefix: "GAL", number: 42 } })).toBe("GAL-42");
    expect(notionText("plain")).toBe("plain");
    expect(notionText(undefined)).toBe("");
    expect(notionText({ type: "people", people: [{ id: "x" }] })).toBe("");
    expect(notionText({ relation: [{ id: "x" }] })).toBe("");
  });

  it("finds properties tolerant to whitespace/unicode", () => {
    expect(findNotionProp({ "SEO Title": { number: 1 } }, "seotitle")).toEqual({ number: 1 });
  });
});

const formula = (s: string | null) => ({ type: "formula", formula: { type: "string", string: s } });
const title = (s: string) => ({ type: "title", title: [{ plain_text: s }] });
const rich = (s: string) => ({ type: "rich_text", rich_text: [{ plain_text: s }] });
const checkbox = (v: boolean) => ({ type: "checkbox", checkbox: v });

describe("normalisers read SEO formula properties", () => {
  it("Journal returns formula SEO Title and Description", () => {
    const a = normalizeJournal({
      id: "p1",
      last_edited_time: "2026-01-01T00:00:00.000Z",
      properties: {
        Title: title("Inside the Session"),
        Slug: rich("inside-the-session"),
        "SEO Title": formula("Inside the Session"),
        "SEO Description": formula("A studio story about the making of the record."),
        Published: checkbox(true),
        "Publish Date": { type: "date", date: { start: "2026-01-01" } },
      },
    });
    expect(a.seoTitle).toBe("Inside the Session");
    expect(a.seoDescription).toBe("A studio story about the making of the record.");
    expect(a.title).toBe("Inside the Session");
    expect(a.published).toBe(true);
  });

  it("Journal blank formulas fall back", () => {
    const a = normalizeJournal({
      id: "p2",
      properties: { Title: title("No SEO"), "SEO Title": formula("  "), "SEO Description": formula(null) },
    });
    expect(a.seoTitle).toBe("");
    expect(a.seoDescription).toBe("");
    expect(seoFor.journalArticle({ ...a, published: true }).title).toBe("No SEO");
  });

  it("Release exposes formula SEO fields", () => {
    const r = normalizeRelease(
      {
        id: "r1",
        properties: {
          Name: title("Heaven In Your Arms"),
          Slug: rich("heaven-in-your-arms"),
          "SEO Title": formula("Heaven In Your Arms by Betty Blane"),
          "SEO Description": formula("A slow-burning soul ballad from Betty Blane."),
          "Show on website": checkbox(true),
          // Present in the live Releases schema; normalizeRelease requires it.
          parentAlbum: { type: "relation", relation: [] },
        },
      },
      new Map(),
    );
    expect(r.seoTitle).toBe("Heaven In Your Arms by Betty Blane");
    expect(r.seoDescription).toBe("A slow-burning soul ballad from Betty Blane.");
    expect(r.title).toBe("Heaven In Your Arms");
  });

  it("Artist exposes formula SEO fields", () => {
    const a = normalizeArtist({
      id: "a1",
      properties: {
        Name: title("Betty Blane"),
        Slug: rich("betty-blane"),
        "SEO Title": formula("Betty Blane, Soul, R&B, Gospel Artist"),
        "SEO Description": formula("Betty Blane is a soul and gospel singer on Wareham Music Group."),
      },
    });
    expect(a.seoTitle).toBe("Betty Blane, Soul, R&B, Gospel Artist");
    expect(a.seoDescription).toBe("Betty Blane is a soul and gospel singer on Wareham Music Group.");
    expect(a.name).toBe("Betty Blane");
  });
});

describe("SEO precedence", () => {
  const longAuthored =
    "Betty Blane is a soul, R&B and gospel singer whose recordings for Wareham Music Group span slow-burning ballads, uptempo gospel-soul and cinematic arrangements built for late-night listening.";

  it("uses authored SEO fields verbatim and appends the brand once", () => {
    const meta = seoFor.artist({
      name: "Betty Blane",
      slug: "betty-blane",
      genre: "Soul",
      shortDescription: "A soul singer.",
      seoTitle: "Betty Blane, Soul, R&B, Gospel Artist",
      seoDescription: longAuthored,
    });
    expect(meta.title).toBe("Betty Blane, Soul, R&B, Gospel Artist");
    expect(meta.description).toBe(longAuthored);
    expect(meta.description.endsWith("…")).toBe(false);
    const full = buildTitle(meta.title!, BRAND_SUFFIX);
    expect(full.match(/Wareham Music Group/g)?.length).toBe(1);
  });

  it("falls back to generated metadata when SEO fields are blank", () => {
    const meta = seoFor.artist({
      name: "Betty Blane",
      slug: "betty-blane",
      genre: "Soul",
      shortDescription: "A soul singer.",
      seoTitle: "   ",
      seoDescription: "",
    });
    expect(meta.title).toBe("Betty Blane, Soul Artist");
    expect(meta.description).toContain("Betty Blane");
  });

  it("release precedence", () => {
    const authored = seoFor.release({
      title: "Heaven In Your Arms",
      slug: "heaven-in-your-arms",
      artistName: "Betty Blane",
      seoTitle: "Heaven In Your Arms by Betty Blane",
      seoDescription: longAuthored,
    });
    expect(authored.title).toBe("Heaven In Your Arms by Betty Blane");
    expect(authored.description).toBe(longAuthored);

    const fallback = seoFor.release({
      title: "Heaven In Your Arms",
      slug: "heaven-in-your-arms",
      artistName: "Betty Blane",
      shortDescription: "A slow-burning soul ballad.",
    });
    expect(fallback.title).toBe("Heaven In Your Arms by Betty Blane");
    expect(fallback.description).toBe("A slow-burning soul ballad.");
  });

  it("journal precedence keeps authored descriptions unsliced", () => {
    const meta = seoFor.journalArticle({
      title: "Inside the Session",
      slug: "inside-the-session",
      seoTitle: "Inside the Session",
      seoDescription: longAuthored,
      excerpt: "Excerpt copy",
      published: true,
    });
    expect(meta.title).toBe("Inside the Session");
    expect(meta.description).toBe(longAuthored);

    const fallback = seoFor.journalArticle({
      title: "Inside the Session",
      slug: "inside-the-session",
      excerpt: "Excerpt copy",
      published: true,
    });
    expect(fallback.description).toBe("Excerpt copy");
  });
});
