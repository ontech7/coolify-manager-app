import { CoolifyApiProvider } from "@/providers/coolify-api-provider";
import { colors } from "@/theme/colors";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <CoolifyApiProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background.secondary },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="application/[uuid]/index"
          options={{
            presentation: "transparentModal",
            animation: "fade_from_bottom",
          }}
        />
        <Stack.Screen
          name="application/[uuid]/logs"
          options={{
            presentation: "transparentModal",
            animation: "fade_from_bottom",
          }}
        />
        <Stack.Screen
          name="deployment/[uuid]"
          options={{
            presentation: "transparentModal",
            animation: "fade_from_bottom",
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </CoolifyApiProvider>
  );
}
