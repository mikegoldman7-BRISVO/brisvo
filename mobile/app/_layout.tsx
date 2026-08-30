import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PlayerProvider } from "../src/lib/player";
import { ShortlistProvider } from "../src/lib/shortlist";
import { theme } from "../src/lib/theme";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaProvider>
        <ShortlistProvider>
          <PlayerProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: theme.colors.background },
                headerTintColor: theme.colors.text,
                headerTitleStyle: { fontFamily: theme.fonts.display },
                contentStyle: { backgroundColor: theme.colors.background },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="artist/[id]"
                options={{ title: "", headerBackTitle: "Voices" }}
              />
              <Stack.Screen
                name="enquiry/[id]"
                options={{ title: "Send an enquiry", presentation: "modal" }}
              />
            </Stack>
          </PlayerProvider>
        </ShortlistProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
