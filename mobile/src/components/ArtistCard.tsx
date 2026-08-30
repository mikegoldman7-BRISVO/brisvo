import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../lib/theme";
import type { ArtistSummary } from "../lib/types";
import { useShortlist } from "../lib/shortlist";
import { Avatar } from "./Avatar";

type Props = {
  artist: ArtistSummary;
  onPress: () => void;
};

export function ArtistCard({ artist, onPress }: Props) {
  const shortlist = useShortlist();
  const colour = artist.brand_color || theme.colors.accent;
  const isSaved = shortlist.has(artist.id);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${artist.name}, ${artist.demo_count} demo${artist.demo_count === 1 ? "" : "s"}`}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <Avatar name={artist.name} uri={artist.photo_url} colour={colour} size={64} radius={theme.radius.md} />

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {artist.name}
        </Text>
        <View style={styles.chips}>
          {artist.categories.slice(0, 2).map(category => (
            <View key={category} style={[styles.chip, { borderColor: `${colour}88` }]}>
              <Text style={[styles.chipText, { color: colour }]}>{category}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.meta}>
          {artist.demo_count} demo{artist.demo_count === 1 ? "" : "s"}
          {artist.gender ? ` · ${artist.gender}` : ""}
        </Text>
      </View>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          shortlist.toggle(artist);
        }}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={isSaved ? `Remove ${artist.name} from shortlist` : `Save ${artist.name} to shortlist`}
        style={styles.saveButton}
      >
        <Text style={[styles.saveIcon, isSaved && { color: colour }]}>{isSaved ? "★" : "☆"}</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  cardPressed: { opacity: 0.7 },
  body: { flex: 1, gap: 6 },
  name: {
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: theme.fonts.display,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chipText: { fontSize: 11, fontWeight: "600" },
  meta: { color: theme.colors.textFaint, fontSize: 12 },
  saveButton: { padding: 4 },
  saveIcon: { fontSize: 24, color: theme.colors.textFaint },
});
