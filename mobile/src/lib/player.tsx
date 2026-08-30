import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import type { ArtistSummary, Demo } from "./types";

export type NowPlaying = {
  demo: Demo;
  artist: Pick<ArtistSummary, "id" | "name" | "photo_url" | "brand_color">;
};

type PlayerContextValue = {
  nowPlaying: NowPlaying | null;
  isPlaying: boolean;
  isBuffering: boolean;
  /** Seconds. */
  position: number;
  /** Seconds. Falls back to the stored demo duration until the file reports one. */
  duration: number;
  /** Starts `demo`, or toggles play/pause when it is already loaded. */
  toggle: (demo: Demo, artist: NowPlaying["artist"]) => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  stop: () => void;
  isActiveDemo: (demoId: Demo["id"]) => boolean;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const player = useAudioPlayer(null, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);

  useEffect(() => {
    // Keeps demos audible when the ringer switch is silenced and lets playback
    // continue while the app is backgrounded (paired with UIBackgroundModes: audio).
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    }).catch(() => {
      // A rejected audio session is not fatal — playback still works in the foreground.
    });
  }, []);

  // `useAudioPlayer` releases the player itself; this only makes sure the
  // lock-screen controls disappear with it.
  useEffect(() => {
    return () => {
      player.clearLockScreenControls();
    };
  }, [player]);

  const toggle = useCallback<PlayerContextValue["toggle"]>(
    (demo, artist) => {
      const isSameDemo = nowPlaying?.demo.id === demo.id;

      if (isSameDemo) {
        if (player.playing) player.pause();
        else player.play();
        return;
      }

      player.replace(demo.file_url);
      setNowPlaying({ demo, artist });
      player.setActiveForLockScreen(
        true,
        {
          title: demo.name,
          artist: artist.name,
          albumTitle: "REAL VOICES",
          artworkUrl: artist.photo_url || undefined,
        },
        { showSeekForward: true, showSeekBackward: true },
      );
      player.play();
    },
    [nowPlaying, player],
  );

  const pause = useCallback(() => {
    player.pause();
  }, [player]);

  const seekTo = useCallback(
    (seconds: number) => {
      player.seekTo(Math.max(0, seconds)).catch(() => {
        // Seeking past the end of a still-buffering file is harmless.
      });
    },
    [player],
  );

  const stop = useCallback(() => {
    player.pause();
    player.clearLockScreenControls();
    setNowPlaying(null);
  }, [player]);

  const isActiveDemo = useCallback(
    (demoId: Demo["id"]) => nowPlaying?.demo.id === demoId,
    [nowPlaying],
  );

  // A finished demo should reset to the start rather than sit at the end,
  // so pressing play again replays it.
  useEffect(() => {
    if (status.didJustFinish) {
      player.seekTo(0).catch(() => {});
    }
  }, [status.didJustFinish, player]);

  const storedDuration = Number(nowPlaying?.demo.duration_secs) || 0;

  const value = useMemo<PlayerContextValue>(
    () => ({
      nowPlaying,
      isPlaying: status.playing,
      isBuffering: status.isBuffering || (!status.isLoaded && Boolean(nowPlaying)),
      position: status.currentTime ?? 0,
      duration: status.duration > 0 ? status.duration : storedDuration,
      toggle,
      pause,
      seekTo,
      stop,
      isActiveDemo,
    }),
    [
      nowPlaying,
      status.playing,
      status.isBuffering,
      status.isLoaded,
      status.currentTime,
      status.duration,
      storedDuration,
      toggle,
      pause,
      seekTo,
      stop,
      isActiveDemo,
    ],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextValue {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used inside a PlayerProvider.");
  return context;
}

export function formatDuration(seconds: number | null | undefined): string {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value <= 0) return "0:00";
  const whole = Math.floor(value);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}
