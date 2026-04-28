import { useQuery } from "@tanstack/react-query";
import {
  fetchArtists,
  fetchReleases,
  fetchTracks,
  fetchHomepageData,
  fetchArtistBySlug,
  fetchReleaseBySlug,
} from "./api";

const STALE = 5 * 60 * 1000; // 5 min — Notion content doesn't change every second

export const useArtists = () =>
  useQuery({ queryKey: ["artists"], queryFn: fetchArtists, staleTime: STALE });

export const useReleases = () =>
  useQuery({ queryKey: ["releases"], queryFn: fetchReleases, staleTime: STALE });

export const useTracks = () =>
  useQuery({ queryKey: ["tracks"], queryFn: fetchTracks, staleTime: STALE });

export const useHomepageData = () =>
  useQuery({ queryKey: ["homepage"], queryFn: fetchHomepageData, staleTime: STALE });

export const useArtistBySlug = (slug: string | undefined) =>
  useQuery({
    queryKey: ["artist", slug],
    queryFn: () => fetchArtistBySlug(slug as string),
    enabled: !!slug,
    staleTime: STALE,
  });

export const useReleaseBySlug = (slug: string | undefined) =>
  useQuery({
    queryKey: ["release", slug],
    queryFn: () => fetchReleaseBySlug(slug as string),
    enabled: !!slug,
    staleTime: STALE,
  });
