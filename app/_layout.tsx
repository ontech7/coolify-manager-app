import { CoolifyApiProvider } from "@/providers/coolify-api-provider";
import { colors } from "@/theme";
import { DarkTheme, ThemeProvider, type Theme } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

export const unstable_settings = {
  anchor: "(tabs)",
};

// Dark navigation theme matching the app palette, so screen containers and
// tab transitions never flash the default light background.
const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary.default,
    background: colors.background.primary,
    card: colors.background.primary,
    text: colors.text.primary,
    border: colors.surface.border,
  },
};

const modalOptions = {
  presentation: "transparentModal",
  animation: "fade_from_bottom",
} as const;

export default function RootLayout() {
  return (
    <ThemeProvider value={navigationTheme}>
      <CoolifyApiProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="application/[uuid]/index"
            options={modalOptions}
          />
          <Stack.Screen
            name="application/[uuid]/deployments"
            options={modalOptions}
          />
          <Stack.Screen
            name="application/[uuid]/rollback"
            options={modalOptions}
          />
          <Stack.Screen name="logs/[uuid]" options={modalOptions} />
          <Stack.Screen name="deployment/[uuid]" options={modalOptions} />
          <Stack.Screen name="disclaimer" options={modalOptions} />
          <Stack.Screen name="server/[uuid]" options={modalOptions} />
        </Stack>
        <StatusBar style="light" />
      </CoolifyApiProvider>
    </ThemeProvider>
  );
}
