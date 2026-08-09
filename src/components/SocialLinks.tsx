import { Instagram, Youtube, Music2, Facebook } from "lucide-react";
import { ORG_SAME_AS } from "@/lib/schema";

type SocialLink = { href: string; label: string; Icon: typeof Instagram };

const ICONS: { match: RegExp; label: string; Icon: typeof Instagram }[] = [
  { match: /instagram\.com/i, label: "Instagram", Icon: Instagram },
  { match: /facebook\.com/i, label: "Facebook", Icon: Facebook },
  { match: /youtube\.com|youtu\.be/i, label: "YouTube", Icon: Youtube },
  { match: /spotify\.com/i, label: "Spotify", Icon: Music2 },
  { match: /music\.apple\.com/i, label: "Apple Music", Icon: Music2 },
  { match: /music\.amazon/i, label: "Amazon Music", Icon: Music2 },
  { match: /tiktok\.com/i, label: "TikTok", Icon: Music2 },
];

const describe = (href: string): SocialLink => {
  const hit = ICONS.find((i) => i.match.test(href));
  return { href, label: hit?.label ?? "Profile", Icon: hit?.Icon ?? Music2 };
};

/**
 * Visible, crawlable profile links. Uses the same URLs that go into schema
 * sameAs — schema plus a visible link is stronger than schema alone.
 */
export const SocialLinks = ({
  urls,
  owner,
  className = "",
}: {
  urls?: (string | null | undefined)[];
  owner?: string;
  className?: string;
}) => {
  const links = (urls ?? ORG_SAME_AS)
    .map((u) => (u ?? "").trim())
    .filter(Boolean)
    .map(describe);
  if (!links.length) return null;

  return (
    <ul className={`flex items-center gap-3 ${className}`}>
      {links.map(({ href, label, Icon }) => (
        <li key={href}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer me"
            aria-label={owner ? `${owner} on ${label}` : `WMG on ${label}`}
            title={owner ? `${owner} on ${label}` : `WMG on ${label}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 text-gold/85 transition-colors hover:border-gold hover:text-gold"
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{owner ? `${owner} on ${label}` : `WMG on ${label}`}</span>
          </a>
        </li>
      ))}
    </ul>
  );
};
