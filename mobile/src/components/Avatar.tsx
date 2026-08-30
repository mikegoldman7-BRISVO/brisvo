import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../lib/theme";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? "")
    .join("");
}

type Props = {
  name: string;
  uri?: string;
  colour?: string;
  size: number;
  radius?: number;
};

/** Photo with a branded initials fallback, matching the website's avatar treatment. */
export function Avatar({ name, uri, colour = theme.colors.accent, size, radius }: Props) {
  const [failed, setFailed] = useState(false);
  const borderRadius = radius ?? size / 2;

  if (!uri || failed) {
    return (
      <View
        style={[
          styles.fallback,
          { width: size, height: size, borderRadius, backgroundColor: colour },
        ]}
      >
        <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials(name)}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius, backgroundColor: theme.colors.surface }}
      contentFit="cover"
      contentPosition="top center"
      transition={200}
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: "center", justifyContent: "center" },
  initials: {
    color: "#fff",
    fontFamily: theme.fonts.display,
    fontWeight: "600",
    letterSpacing: 1,
  },
});
