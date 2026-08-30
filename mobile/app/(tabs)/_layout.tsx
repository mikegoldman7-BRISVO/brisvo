import { BottomTabBar, Tabs } from "expo-router/tabs";
import type { BottomTabBarProps } from "expo-router/tabs";
import { StyleSheet, Text, View, type ColorValue } from "react-native";
import { MiniPlayer } from "../../src/components/MiniPlayer";
import { theme } from "../../src/lib/theme";

function TabIcon({ glyph, color }: { glyph: string; color: ColorValue }) {
  return <Text style={{ color, fontSize: 20 }}>{glyph}</Text>;
}

/**
 * Docks the mini-player directly above the tab bar so playback controls stay
 * reachable from every tab without covering content.
 */
function TabBarWithPlayer(props: BottomTabBarProps) {
  return (
    <View style={styles.tabBarWrapper}>
      <MiniPlayer />
      <BottomTabBar {...props} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={TabBarWithPlayer}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textFaint,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
        },
        sceneStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Voices",
          tabBarIcon: ({ color }) => <TabIcon glyph="🎙" color={color} />,
        }}
      />
      <Tabs.Screen
        name="shortlist"
        options={{
          title: "Shortlist",
          tabBarIcon: ({ color }) => <TabIcon glyph="★" color={color} />,
        }}
      />
      <Tabs.Screen
        name="info"
        options={{
          title: "About",
          tabBarIcon: ({ color }) => <TabIcon glyph="ⓘ" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: { backgroundColor: theme.colors.background },
});
