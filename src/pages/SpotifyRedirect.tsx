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
      <Seo {...staticSeo("spotify")} />
      <Helmet>
        <meta httpEquiv="refresh" content={`0;url=${SPOTIFY_URL}`} />
      </Helmet>
    </>
  );
};

export default SpotifyRedirect;
