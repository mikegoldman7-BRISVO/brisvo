import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArtistCard } from "../../src/components/ArtistCard";
import { EmptyState, LoadingState } from "../../src/components/States";
import { useShortlist } from "../../src/lib/shortlist";
import { theme } from "../../src/lib/theme";

export default function ShortlistScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const shortlist = useShortlist();

  if (!shortlist.isReady) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <LoadingState label="Opening your shortlist…" />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FlatList
        data={shortlist.artists}
        keyExtractor={artist => artist.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Shortlist</Text>
            <Text style={styles.lede}>
              Saved on this device, so it works with no signal — handy in a studio.
            </Text>
            {shortlist.artists.length > 0 ? (
              <Pressable
                onPress={shortlist.clear}
                accessibilityRole="button"
                style={styles.clearButton}
              >
                <Text style={styles.clearText}>Clear all</Text>
              </Pressable>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <ArtistCard artist={item} onPress={() => router.push(`/artist/${item.id}`)} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            title="Nothing saved yet"
            body="Tap the star on any voice to keep them here for your next brief."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  listContent: { padding: 16, paddingBottom: 32 },
  header: { gap: 8, marginBottom: 18 },
  title: { color: theme.colors.text, fontSize: 30, fontFamily: theme.fonts.display },
  lede: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 20 },
  clearButton: { alignSelf: "flex-start", paddingVertical: 6 },
  clearText: { color: theme.colors.accent, fontWeight: "600", fontSize: 13 },
  separator: { height: 10 },
});
