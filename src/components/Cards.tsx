import { Link } from "react-router-dom";
import type { Artist, Release } from "@/lib/types";

export const ArtistCard = ({ artist }: { artist: Artist }) => (
  <Link
    to={`/artists/${encodeURIComponent(artist.slug)}`}
    className="group block hover-zoom cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
    aria-label={`View ${artist.name}`}
  >
    <div className="relative overflow-hidden bg-muted aspect-[3/4]">
      {artist.heroImage ? (
        <img
          src={artist.heroImage}
          alt={artist.name}
          loading="lazy"
          width={900}
          height={1200}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center p-6 text-center text-muted-foreground">Image coming soon.</div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    </div>
    <div className="pt-5">
      <h3 className="font-serif text-2xl md:text-3xl">{artist.name}</h3>
        <p className="eyebrow mt-2 text-current/60">{artist.genre}</p>
      {artist.shortDescription && (
        <p className="text-sm text-current/60 mt-3 line-clamp-2">{artist.shortDescription}</p>
      )}
    </div>
  </Link>
);

export const ReleaseCard = ({ release }: { release: Release }) => {
  const date = release.releaseDate ? new Date(release.releaseDate) : null;
  const monthYear = date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString(undefined, { month: "long", year: "numeric" }).toUpperCase()
    : "TBC";
  return (
    <Link
      to={`/releases/${encodeURIComponent(release.slug)}`}
      className="group block hover-zoom cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
      aria-label={`View ${release.title}`}
    >
      <div className="relative overflow-hidden bg-muted aspect-square">
        {release.coverArt ? (
          <img
            src={release.coverArt}
            alt={`${release.title} by ${release.artistName}`}
            loading="lazy"
            width={1200}
            height={1200}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center p-6 text-center text-muted-foreground">Artwork coming soon.</div>
        )}
      </div>
      <div className="pt-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-xl md:text-2xl leading-tight">{release.title}</h3>
          <p className="text-sm text-current/60 mt-1">{release.artistName}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="eyebrow text-current/60">{release.releaseType}</p>
          <p className="text-xs text-current/60 mt-1">{monthYear}</p>
        </div>
      </div>
    </Link>
  );
};
