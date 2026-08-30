import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArtistCard } from "../../src/components/ArtistCard";
import { BrandMark } from "../../src/components/Brand";
import { EmptyState, ErrorState, LoadingState } from "../../src/components/States";
import { fetchPublishedArtists } from "../../src/lib/artists";
import { CATEGORIES, GENDER_FILTERS } from "../../src/lib/content";
import { theme } from "../../src/lib/theme";
import type { ArtistSummary } from "../../src/lib/types";

export default function VoicesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [artists, setArtists] = useState<ArtistSummary[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const rows = await fetchPublishedArtists();
      setArtists(rows);
      setStatus("ready");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load voices.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();

    return artists.filter(artist => {
      // Gender chips match the artist's gender field; every other chip is a category.
      const matchesFilter =
        filter === "All" ||
        (GENDER_FILTERS.has(filter)
          ? artist.gender.toLowerCase() === filter.toLowerCase() ||
            artist.categories.includes(filter)
          : artist.categories.includes(filter));

      if (!matchesFilter) return false;
      if (!search) return true;

      return (
        artist.name.toLowerCase().includes(search) ||
        artist.categories.some(category => category.toLowerCase().includes(search))
      );
    });
  }, [artists, filter, query]);

  if (status === "loading") {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <LoadingState label="Finding voices…" />
      </View>
    );
  }

  if (status === "error") {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ErrorState message={error} onRetry={load} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FlatList
        data={visible}
        keyExtractor={artist => artist.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <BrandMark />
            <Text style={styles.lede}>
              Brisbane&apos;s voice-over collective. Hear the demo before you book.
            </Text>

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name or style"
              placeholderTextColor={theme.colors.textFaint}
              style={styles.search}
              autoCorrect={false}
              clearButtonMode="while-editing"
              accessibilityLabel="Search voices"
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {CATEGORIES.map(category => {
                const isActive = category === filter;
                return (
                  <Pressable
                    key={category}
                    onPress={() => setFilter(category)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    style={[styles.chip, isActive && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {category}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => (
          <ArtistCard artist={item} onPress={() => router.push(`/artist/${item.id}`)} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            title="No voices match"
            body="Try a different category, or clear your search."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  listContent: { padding: 16, paddingBottom: 32 },
  header: { gap: 14, marginBottom: 18 },
  lede: { color: theme.colors.textMuted, fontSize: 15, lineHeight: 21 },
  search: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  chipRow: { gap: 8, paddingRight: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderStrong,
  },
  chipActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  chipText: { color: theme.colors.textMuted, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  separator: { height: 10 },
});
