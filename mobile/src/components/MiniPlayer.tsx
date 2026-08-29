import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { formatDuration, usePlayer } from "../lib/player";
import { theme } from "../lib/theme";
import { Avatar } from "./Avatar";

/**
 * Persistent transport docked above the tab bar. Stays mounted across tabs so a
 * demo keeps playing while the user browses.
 */
export function MiniPlayer() {
  const player = usePlayer();
  const router = useRouter();
  const { nowPlaying } = player;

  if (!nowPlaying) return null;

  const colour = nowPlaying.artist.brand_color || theme.colors.accent;
  const progress = player.duration > 0 ? Math.min(1, player.position / player.duration) : 0;

  return (
    <View style={styles.wrapper}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: colour }]} />
      </View>

      <Pressable
        style={styles.row}
        accessibilityRole="button"
        accessibilityLabel={`Open ${nowPlaying.artist.name}`}
        onPress={() => router.push(`/artist/${nowPlaying.artist.id}`)}
      >
        <Avatar
          name={nowPlaying.artist.name}
          uri={nowPlaying.artist.photo_url}
          colour={colour}
          size={40}
          radius={theme.radius.sm}
        />

        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={1}>
            {nowPlaying.demo.name}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {nowPlaying.artist.name} · {formatDuration(player.position)} / {formatDuration(player.duration)}
          </Text>
        </View>

        <Pressable
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={player.isPlaying ? "Pause" : "Play"}
          onPress={() => player.toggle(nowPlaying.demo, nowPlaying.artist)}
          style={[styles.control, { backgroundColor: colour }]}
        >
          {player.isBuffering ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.controlIcon}>{player.isPlaying ? "❙❙" : "▶"}</Text>
          )}
        </Pressable>

        <Pressable
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Stop playback"
          onPress={player.stop}
          style={styles.close}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceRaised,
  },
  progressTrack: { height: 2, backgroundColor: theme.colors.border },
  progressFill: { height: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  text: { flex: 1 },
  title: { color: theme.colors.text, fontSize: 14, fontWeight: "600" },
  subtitle: { color: theme.colors.textFaint, fontSize: 12, marginTop: 2 },
  control: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  controlIcon: { color: "#fff", fontSize: 13 },
  close: { padding: 4 },
  closeIcon: { color: theme.colors.textFaint, fontSize: 16 },
});
