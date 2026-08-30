import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { formatDuration, usePlayer, type NowPlaying } from "../lib/player";
import { theme } from "../lib/theme";
import type { Demo } from "../lib/types";

type Props = {
  demo: Demo;
  artist: NowPlaying["artist"];
  colour: string;
};

export function DemoRow({ demo, artist, colour }: Props) {
  const player = usePlayer();
  const isActive = player.isActiveDemo(demo.id);
  const isPlayingThis = isActive && player.isPlaying;
  const progress =
    isActive && player.duration > 0 ? Math.min(1, player.position / player.duration) : 0;

  return (
    <Pressable
      onPress={() => player.toggle(demo, artist)}
      accessibilityRole="button"
      accessibilityState={{ selected: isPlayingThis }}
      accessibilityLabel={`${isPlayingThis ? "Pause" : "Play"} ${demo.name}`}
      style={({ pressed }) => [
        styles.row,
        isActive && { borderColor: `${colour}66`, backgroundColor: `${colour}14` },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.button, { backgroundColor: isActive ? colour : theme.colors.surfaceRaised }]}>
        {isActive && player.isBuffering ? (
          <ActivityIndicator size="small" color={isActive ? "#fff" : colour} />
        ) : (
          <Text style={[styles.buttonIcon, { color: isActive ? "#fff" : colour }]}>
            {isPlayingThis ? "❙❙" : "▶"}
          </Text>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {demo.name}
        </Text>
        {isActive ? (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: colour }]} />
          </View>
        ) : null}
      </View>

      <Text style={styles.duration}>
        {isActive ? formatDuration(player.position) : formatDuration(demo.duration_secs)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  pressed: { opacity: 0.75 },
  button: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  buttonIcon: { fontSize: 13 },
  body: { flex: 1, gap: 6 },
  name: { color: theme.colors.text, fontSize: 15 },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    overflow: "hidden",
  },
  progressFill: { height: 3, borderRadius: 2 },
  duration: { color: theme.colors.textFaint, fontSize: 12, fontVariant: ["tabular-nums"] },
});
