import { Link } from "react-router-dom";
import type { JournalBlock, JournalRichText } from "@/lib/types";
import { LazyImage } from "@/components/LazyImage";

const renderRich = (rich: JournalRichText[]) =>
  rich.map((r, i) => {
    let node: React.ReactNode = r.text;
    if (r.code) node = <code key={i} className="px-1 py-0.5 bg-ivory/10 text-gold-soft text-[0.92em]">{node}</code>;
    if (r.bold) node = <strong className="font-medium text-ivory">{node}</strong>;
    if (r.italic) node = <em className="italic">{node}</em>;
    if (r.underline) node = <span className="underline underline-offset-4">{node}</span>;
    if (r.href) {
      return (
        <a key={i} href={r.href} target="_blank" rel="noreferrer noopener" className="text-gold underline underline-offset-4 decoration-gold/40 hover:decoration-gold transition-colors">
          {node}
        </a>
      );
    }
    return <span key={i}>{node}</span>;
  });

export const ArticleBody = ({ blocks }: { blocks: JournalBlock[] }) => (
  <div className="mx-auto w-full max-w-[720px] text-ivory/85 font-light text-[1.075rem] md:text-[1.15rem] leading-[1.75]">
    {blocks.map((b, i) => {
      switch (b.type) {
        case "paragraph":
          if (b.rich.length === 0) return <div key={i} className="h-3" />;
          return (
            <p key={i} className="mb-7">
              {renderRich(b.rich)}
            </p>
          );
        case "heading_2":
          return (
            <h2 key={i} className="font-serif text-3xl md:text-4xl text-ivory mt-14 mb-6 leading-tight">
              {renderRich(b.rich)}
            </h2>
          );
        case "heading_3":
          return (
            <h3 key={i} className="font-serif text-2xl md:text-3xl text-ivory/95 mt-10 mb-4 leading-snug">
              {renderRich(b.rich)}
            </h3>
          );
        case "quote":
          return (
            <blockquote key={i} className="my-10 border-l-2 border-gold pl-6 md:pl-8 font-serif italic text-2xl md:text-3xl text-ivory/90 leading-snug">
              {renderRich(b.rich)}
            </blockquote>
          );
        case "divider":
          return <hr key={i} className="my-12 border-0 h-px bg-ivory/15" />;
        case "bulleted_list":
          return (
            <ul key={i} className="my-6 list-disc pl-6 marker:text-gold/60 space-y-2">
              {b.items.map((it, j) => <li key={j}>{renderRich(it)}</li>)}
            </ul>
          );
        case "numbered_list":
          return (
            <ol key={i} className="my-6 list-decimal pl-6 marker:text-gold/60 space-y-2">
              {b.items.map((it, j) => <li key={j}>{renderRich(it)}</li>)}
            </ol>
          );
        case "image":
          return (
            <figure key={i} className="my-10 -mx-2 md:-mx-12">
              <div className="overflow-hidden bg-ivory/5">
                <LazyImage src={b.url} alt={b.alt} width={1600} height={1066} displayWidth={960} sizes="(min-width:768px) 720px, 100vw" className="object-cover" />
              </div>
              {b.caption && (
                <figcaption className="mt-3 text-sm text-ivory/55 italic text-center">{b.caption}</figcaption>
              )}
            </figure>
          );
        default:
          return null;
      }
    })}
  </div>
);

export const formatJournalDate = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};
