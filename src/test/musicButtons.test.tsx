import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StreamingLinks } from "@/pages/Music";
import type { CatalogueTrack } from "@/lib/types";

const track = (overrides: Partial<CatalogueTrack> = {}): CatalogueTrack => ({
  id: "t1",
  title: "Heaven In",
  artists: [],
  duration: "3:20",
  description: "",
  lyrics: "",
  isrc: "GB1234567890",
  links: {
    spotify: "https://open.spotify.com/track/1",
    appleMusic: "https://music.apple.com/track/1",
    amazonMusic: null,
    youtubeMusic: null,
  },
  appearsOn: [],
  ...overrides,
});

const labels = () => screen.getAllByRole("link").map((a) => a.getAttribute("aria-label") ?? "");

describe("Music page streaming buttons", () => {
  it("renders YouTube first, before Spotify and Apple Music", () => {
    render(<StreamingLinks track={track({ youtubeUrl: "https://www.youtube.com/watch?v=abcdefghijk" })} />);
    const order = labels();
    expect(order[0]).toBe("Watch Heaven In on YouTube (opens in a new tab)");
    expect(order[1]).toContain("Spotify");
    expect(order[2]).toContain("Apple Music");
  });

  it("opens YouTube safely in a new tab", () => {
    render(<StreamingLinks track={track({ youtubeUrl: "https://www.youtube.com/watch?v=abcdefghijk" })} />);
    const link = screen.getByRole("link", { name: /on YouTube/i });
    expect(link).toHaveAttribute("href", "https://www.youtube.com/watch?v=abcdefghijk");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders no YouTube button when no eligible video was found", () => {
    render(<StreamingLinks track={track()} />);
    expect(screen.queryByRole("link", { name: /on YouTube/i })).toBeNull();
    const order = labels();
    expect(order).toHaveLength(2);
    expect(order[0]).toContain("Spotify");
    expect(order[1]).toContain("Apple Music");
  });

  it("still renders when YouTube is the only available link", () => {
    render(
      <StreamingLinks
        track={track({
          youtubeUrl: "https://www.youtube.com/watch?v=abcdefghijk",
          links: { spotify: null, appleMusic: null, amazonMusic: null, youtubeMusic: null },
        })}
      />,
    );
    expect(labels()).toHaveLength(1);
  });
});
