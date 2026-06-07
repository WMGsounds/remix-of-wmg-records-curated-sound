import { Music } from "lucide-react";
import { SiYoutube, SiSpotify, SiApplemusic } from "react-icons/si";
import type { ComponentType, SVGProps } from "react";
import type { StreamingLinks } from "@/lib/types";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type Entry = {
  key: "youtubeMusic" | "spotify" | "appleMusic" | "amazonMusic";
  label: string;
  Icon: IconComponent;
  fill?: boolean;
};

const ORDER: Entry[] = [
  { key: "youtubeMusic", label: "YouTube Music", Icon: SiYoutube as IconComponent, fill: true },
  { key: "spotify", label: "Spotify", Icon: SiSpotify as IconComponent, fill: true },
  { key: "appleMusic", label: "Apple Music", Icon: SiApplemusic as IconComponent, fill: true },
  { key: "amazonMusic", label: "Amazon Music", Icon: Music as IconComponent, fill: true },
];

export const ReleaseLinks = ({ links }: { links?: StreamingLinks }) => {
  if (!links) return null;
  const items = ORDER.filter((e) => {
    const v = links[e.key];
    return typeof v === "string" && v.trim().length > 0;
  });
  if (items.length === 0) return null;

  return (
    <div className="mt-6">
      <p className="eyebrow mb-4 text-gold-soft">Listen &amp; Watch</p>
      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-3">
        {items.map(({ key, label, Icon, fill }) => (
          <a
            key={key}
            href={links[key]!}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center gap-2 rounded-full border border-gold/40 bg-ink/80 px-5 py-2.5 text-[11px] uppercase tracking-[0.22em] text-ivory transition-colors duration-300 hover:border-gold hover:bg-gold/10 hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <Icon
              className="h-4 w-4 text-gold-soft transition-colors duration-300 group-hover:text-gold"
              aria-hidden="true"
              {...(fill ? { fill: "currentColor" } : {})}
            />
            <span>{label}</span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default ReleaseLinks;
