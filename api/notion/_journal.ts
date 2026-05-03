// Journal: normalization for the Journal database + page body block fetching.
import { proxyImageIfNeeded } from "./_imageHelper.js";

const text = (p: any): string =>
  (p?.rich_text ?? p?.title ?? []).map((t: any) => t.plain_text).join("").trim();

const num = (p: any): number => p?.number ?? 0;
const bool = (p: any): boolean => p?.type === "checkbox" && p.checkbox === true;
const select = (p: any): string => p?.select?.name ?? "";
const date = (p: any): string => p?.date?.start ?? "";

const fileUrl = (f: any): string => {
  const raw = f?.type === "external" ? f.external.url : f?.file?.url ?? "";
  return raw ? proxyImageIfNeeded(raw) : "";
};
const firstFile = (p: any): string => (p?.files ?? []).map(fileUrl).filter(Boolean)[0] ?? "";

const relationIds = (p: any): string[] => (p?.relation ?? []).map((r: any) => r.id);

export type JournalArticle = {
  id: string;
  slug: string;
  title: string;
  category: string;
  artistIds: string[];
  releaseIds: string[];
  trackIds: string[];
  album: string;
  publishedDate: string;
  coverImage: string;
  excerpt: string;
  summary: string;
  readingTime: number;
  published: boolean;
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  imageAlt: string;
  createdTime: string;
  lastEditedTime: string;
};

export function normalizeJournal(page: any): JournalArticle {
  const props = page.properties ?? {};
  const titleProp = Object.values(props).find((p: any) => p?.type === "title") ?? props["Title"] ?? props["Name"];
  return {
    id: page.id,
    slug: text(props["Slug"]) || page.id,
    title: text(titleProp) || "Untitled",
    category: select(props["Category"]) || text(props["Category"]),
    artistIds: relationIds(props["Artist"]),
    releaseIds: relationIds(props["Release"]),
    trackIds: relationIds(props["Track"]),
    album: text(props["Album"]),
    publishedDate: date(props["Published Date"]),
    coverImage: firstFile(props["Cover Image"]),
    excerpt: text(props["Excerpt"]),
    summary: text(props["Summary"]),
    readingTime: num(props["Reading Time"]),
    published: bool(props["Published"]),
    featured: bool(props["Featured"]),
    seoTitle: text(props["SEO Title"]),
    seoDescription: text(props["SEO Description"]),
    imageAlt: text(props["Image Alt Text"]),
    createdTime: page.created_time ?? "",
    lastEditedTime: page.last_edited_time ?? "",
  };
}

// ---------- Page body block fetching ----------

export type RichText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
  href?: string | null;
};

export type ArticleBlock =
  | { type: "paragraph"; rich: RichText[] }
  | { type: "heading_2"; rich: RichText[] }
  | { type: "heading_3"; rich: RichText[] }
  | { type: "quote"; rich: RichText[] }
  | { type: "divider" }
  | { type: "bulleted_list"; items: RichText[][] }
  | { type: "numbered_list"; items: RichText[][] }
  | { type: "image"; url: string; caption: string; alt: string };

const richFrom = (rt: any[] = []): RichText[] =>
  rt.map((t: any) => ({
    text: t.plain_text ?? "",
    bold: t.annotations?.bold,
    italic: t.annotations?.italic,
    underline: t.annotations?.underline,
    code: t.annotations?.code,
    href: t.href ?? null,
  }));

const plainCaption = (rt: any[] = []): string => rt.map((t: any) => t.plain_text ?? "").join("");

async function listChildren(notion: any, blockId: string): Promise<any[]> {
  const out: any[] = [];
  let cursor: string | undefined;
  do {
    const r = await notion.blocks.children.list({ block_id: blockId, start_cursor: cursor, page_size: 100 });
    out.push(...r.results);
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return out;
}

export async function fetchPageBlocks(notion: any, pageId: string): Promise<ArticleBlock[]> {
  const raw = await listChildren(notion, pageId);
  const blocks: ArticleBlock[] = [];

  // Group consecutive list items.
  let listBuffer: { kind: "bulleted" | "numbered"; items: RichText[][] } | null = null;
  const flushList = () => {
    if (!listBuffer) return;
    blocks.push(
      listBuffer.kind === "bulleted"
        ? { type: "bulleted_list", items: listBuffer.items }
        : { type: "numbered_list", items: listBuffer.items },
    );
    listBuffer = null;
  };

  for (const b of raw) {
    const t = b.type;
    if (t === "bulleted_list_item" || t === "numbered_list_item") {
      const kind = t === "bulleted_list_item" ? "bulleted" : "numbered";
      if (!listBuffer || listBuffer.kind !== kind) {
        flushList();
        listBuffer = { kind, items: [] };
      }
      listBuffer.items.push(richFrom(b[t]?.rich_text ?? []));
      continue;
    }
    flushList();

    switch (t) {
      case "paragraph":
        blocks.push({ type: "paragraph", rich: richFrom(b.paragraph?.rich_text ?? []) });
        break;
      case "heading_1":
      case "heading_2":
        blocks.push({ type: "heading_2", rich: richFrom(b[t]?.rich_text ?? []) });
        break;
      case "heading_3":
        blocks.push({ type: "heading_3", rich: richFrom(b.heading_3?.rich_text ?? []) });
        break;
      case "quote":
        blocks.push({ type: "quote", rich: richFrom(b.quote?.rich_text ?? []) });
        break;
      case "divider":
        blocks.push({ type: "divider" });
        break;
      case "image": {
        const img = b.image;
        const raw = img?.type === "external" ? img.external?.url : img?.file?.url;
        if (raw) {
          blocks.push({
            type: "image",
            url: proxyImageIfNeeded(raw),
            caption: plainCaption(img?.caption ?? []),
            alt: plainCaption(img?.caption ?? []) || "Article image",
          });
        }
        break;
      }
      default:
        break;
    }
  }
  flushList();
  return blocks;
}

export function estimateReadingTime(blocks: ArticleBlock[]): number {
  const words = blocks
    .flatMap((b) => {
      if ("rich" in b) return b.rich.map((r) => r.text);
      if (b.type === "bulleted_list" || b.type === "numbered_list")
        return b.items.flatMap((i) => i.map((r) => r.text));
      return [];
    })
    .join(" ")
    .trim()
    .split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

export function deriveExcerpt(blocks: ArticleBlock[], len = 180): string {
  for (const b of blocks) {
    if (b.type === "paragraph") {
      const txt = b.rich.map((r) => r.text).join("").trim();
      if (txt.length > 0) return txt.length > len ? txt.slice(0, len).trim() + "…" : txt;
    }
  }
  return "";
}
