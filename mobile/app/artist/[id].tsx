import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { Avatar } from "../../src/components/Avatar";
import { DemoRow } from "../../src/components/DemoRow";
import { EmptyState, ErrorState, LoadingState } from "../../src/components/States";
import { fetchArtistDetail } from "../../src/lib/artists";
import { WEBSITE_URL } from "../../src/lib/content";
import { useShortlist } from "../../src/lib/shortlist";
import { theme } from "../../src/lib/theme";
import type { ArtistDetail } from "../../src/lib/types";

export default function ArtistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const shortlist = useShortlist();
  const [artist, setArtist] = useState<ArtistDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setStatus("loading");
      setError("");
      setArtist(await fetchArtistDetail(id));
      setStatus("ready");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load this voice.");
      setStatus("error");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (status === "loading") return <LoadingState label="Loading profile…" />;
  if (status === "error" || !artist) {
    return <ErrorState message={error || "Voice not found."} onRetry={load} />;
  }

  const colour = artist.brand_color || theme.colors.accent;
  const isSaved = shortlist.has(artist.id);

  const onShare = () => {
    Share.share({
      message: `${artist.name} — a Brisbane voice on REAL VOICES, powered by BrisVO.com. ${WEBSITE_URL}`,
    }).catch(() => {
      // The user dismissing the sheet is not an error.
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: artist.name }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Avatar
            name={artist.name}
            uri={artist.photo_url}
            colour={colour}
            size={112}
            radius={theme.radius.lg}
          />
          <View style={styles.heroText}>
            <Text style={styles.name}>{artist.name}</Text>
            <Text style={styles.subtitle}>
              {[artist.gender, "Australian voice artist"].filter(Boolean).join(" · ")}
            </Text>
            <View style={styles.chips}>
              {artist.categories.map(category => (
                <View key={category} style={[styles.chip, { borderColor: `${colour}88` }]}>
                  <Text style={[styles.chipText, { color: colour }]}>{category}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => router.push(`/enquiry/${artist.id}`)}
            accessibilityRole="button"
            style={[styles.primaryButton, { backgroundColor: colour }]}
          >
            <Text style={styles.primaryButtonText}>Enquire</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              shortlist.toggle(artist);
            }}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? "Remove from shortlist" : "Save to shortlist"}
            style={[styles.secondaryButton, isSaved && { borderColor: colour }]}
          >
            <Text style={[styles.secondaryButtonText, isSaved && { color: colour }]}>
              {isSaved ? "★ Saved" : "☆ Save"}
            </Text>
          </Pressable>

          <Pressable
            onPress={onShare}
            accessibilityRole="button"
            accessibilityLabel="Share this voice"
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Share</Text>
          </Pressable>
        </View>

        {artist.bio ? <Text style={styles.bio}>{artist.bio}</Text> : null}

        <Text style={styles.sectionTitle}>Demos</Text>
        {artist.demos.length === 0 ? (
          <EmptyState
            title="No demos yet"
            body="This artist hasn't uploaded demo reels. Send an enquiry and they'll share samples directly."
          />
        ) : (
          <View style={styles.demoList}>
            {artist.demos.map(demo => (
              <DemoRow
                key={String(demo.id)}
                demo={demo}
                artist={{
                  id: artist.id,
                  name: artist.name,
                  photo_url: artist.photo_url,
                  brand_color: artist.brand_color,
                }}
                colour={colour}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16, paddingBottom: 40, gap: 18 },
  hero: { flexDirection: "row", gap: 16 },
  heroText: { flex: 1, gap: 6 },
  name: { color: theme.colors.text, fontSize: 26, fontFamily: theme.fonts.display },
  subtitle: { color: theme.colors.textMuted, fontSize: 13 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  chipText: { fontSize: 11, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 10 },
  primaryButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: theme.radius.pill,
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: theme.radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderStrong,
  },
  secondaryButtonText: { color: theme.colors.textMuted, fontWeight: "600", fontSize: 14 },
  bio: { color: theme.colors.textMuted, fontSize: 15, lineHeight: 23 },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontFamily: theme.fonts.display,
  },
  demoList: { gap: 8 },
});
