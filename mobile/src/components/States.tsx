import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../lib/theme";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <View style={styles.centre}>
      <ActivityIndicator color={theme.colors.accent} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.centre}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.muted}>{message}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} style={styles.retry} accessibilityRole="button">
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.centre}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.muted}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centre: { alignItems: "center", justifyContent: "center", gap: 10, padding: 32 },
  muted: { color: theme.colors.textMuted, textAlign: "center", lineHeight: 20 },
  errorTitle: { color: theme.colors.danger, fontSize: 17, fontFamily: theme.fonts.display },
  emptyTitle: { color: theme.colors.text, fontSize: 19, fontFamily: theme.fonts.display },
  retry: {
    marginTop: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accent,
  },
  retryText: { color: "#fff", fontWeight: "600" },
});
