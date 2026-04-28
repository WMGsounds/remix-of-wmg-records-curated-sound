import { Link } from "react-router-dom";
import type { Artist, Release } from "@/lib/types";

export const ArtistCard = ({ artist }: { artist: Artist }) => (
  <Link to={`/artists/${artist.slug}`} className="group block hover-zoom">
    <div className="relative overflow-hidden bg-muted aspect-[3/4]">
      <img
        src={artist.heroImage}
        alt={artist.name}
        loading="lazy"
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    </div>
    <div className="pt-5">
      <h3 className="font-serif text-2xl md:text-3xl">{artist.name}</h3>
      <p className="eyebrow mt-2">{artist.genre}</p>
      {artist.shortDescription && (
        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{artist.shortDescription}</p>
      )}
    </div>
  </Link>
);

export const ReleaseCard = ({ release }: { release: Release }) => {
  const year = new Date(release.releaseDate).getFullYear();
  return (
    <Link to={`/releases/${release.slug}`} className="group block hover-zoom">
      <div className="relative overflow-hidden bg-muted aspect-square">
        <img
          src={release.coverArt}
          alt={`${release.title} by ${release.artistName}`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="pt-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-xl md:text-2xl leading-tight">{release.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{release.artistName}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="eyebrow">{release.releaseType}</p>
          <p className="text-xs text-muted-foreground mt-1">{year}</p>
        </div>
      </div>
    </Link>
  );
};
