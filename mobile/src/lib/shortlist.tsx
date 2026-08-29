import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ArtistSummary } from "./types";

const STORAGE_KEY = "realvoices.shortlist.v1";

type ShortlistContextValue = {
  /** Cached artist summaries, newest addition first. */
  artists: ArtistSummary[];
  /** False until the persisted shortlist has been read from disk. */
  isReady: boolean;
  has: (artistId: string) => boolean;
  toggle: (artist: ArtistSummary) => void;
  remove: (artistId: string) => void;
  clear: () => void;
};

const ShortlistContext = createContext<ShortlistContextValue | null>(null);

export function ShortlistProvider({ children }: { children: React.ReactNode }) {
  const [artists, setArtists] = useState<ArtistSummary[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (cancelled || !raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setArtists(parsed as ArtistSummary[]);
      })
      .catch(() => {
        // A corrupt or unreadable shortlist just starts empty.
      })
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist only after the initial read, so an empty first render cannot
  // overwrite a stored shortlist.
  useEffect(() => {
    if (!isReady) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(artists)).catch(() => {});
  }, [artists, isReady]);

  const has = useCallback(
    (artistId: string) => artists.some(artist => artist.id === artistId),
    [artists],
  );

  const toggle = useCallback((artist: ArtistSummary) => {
    setArtists(current =>
      current.some(entry => entry.id === artist.id)
        ? current.filter(entry => entry.id !== artist.id)
        : [artist, ...current],
    );
  }, []);

  const remove = useCallback((artistId: string) => {
    setArtists(current => current.filter(entry => entry.id !== artistId));
  }, []);

  const clear = useCallback(() => setArtists([]), []);

  const value = useMemo<ShortlistContextValue>(
    () => ({ artists, isReady, has, toggle, remove, clear }),
    [artists, isReady, has, toggle, remove, clear],
  );

  return <ShortlistContext.Provider value={value}>{children}</ShortlistContext.Provider>;
}

export function useShortlist(): ShortlistContextValue {
  const context = useContext(ShortlistContext);
  if (!context) throw new Error("useShortlist must be used inside a ShortlistProvider.");
  return context;
}
