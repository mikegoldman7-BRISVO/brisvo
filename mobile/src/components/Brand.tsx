import { StyleSheet, Text, View } from "react-native";
import { theme } from "../lib/theme";

/** The app's lockup: REAL VOICES, powered by BrisVO.com. */
export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.title, compact && styles.titleCompact]}>
        REAL <Text style={styles.accent}>VOICES</Text>
      </Text>
      <Text style={styles.poweredBy}>powered by BrisVO.com</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "flex-start" },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 30,
    letterSpacing: 3,
  },
  titleCompact: { fontSize: 20, letterSpacing: 2 },
  accent: { color: theme.colors.accent },
  poweredBy: {
    color: theme.colors.textFaint,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    marginTop: 2,
  },
});
