import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Seo } from "@/components/Seo";

const SPOTIFY_URL = "https://open.spotify.com/user/315vlgpfq47hf6pebgugkm6rbgxq";

const SpotifyRedirect = () => {
  useEffect(() => {
    window.location.replace(SPOTIFY_URL);
  }, []);

  return (
    <>
      <Seo
        fullTitle="Spotify | Wareham Music Group"
        description="Follow Wareham Music Group on Spotify."
        canonicalPath="/spotify"
        noindex
      />
      <Helmet>
        <meta httpEquiv="refresh" content={`0;url=${SPOTIFY_URL}`} />
      </Helmet>
    </>
  );
};

export default SpotifyRedirect;
